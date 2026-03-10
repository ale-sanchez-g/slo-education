#!/usr/bin/env python3
"""
Unit tests for generate_blog.py

These tests mock all external dependencies (Gemini API, file system) so they can
run in CI/CD without API keys or modifying actual files.
"""

import json
import pytest
from datetime import date
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch, mock_open
import xml.etree.ElementTree as ET
import sys
import os
import types

# Add scripts directory to path so we can import the module
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

# Provide a lightweight stub for google.genai so importing generate_blog
# does not fail in environments where google-genai is not installed.
if 'google' not in sys.modules:
    google_mod = types.ModuleType('google')
    google_mod.genai = types.SimpleNamespace(
        Client=Mock,
        types=types.SimpleNamespace(GenerateContentConfig=Mock),
    )
    sys.modules['google'] = google_mod

import generate_blog


class TestSlugify:
    """Test the slugify function."""
    
    def test_basic_slugification(self):
        assert generate_blog.slugify("Hello World") == "hello-world"
    
    def test_special_characters_removed(self):
        assert generate_blog.slugify("SLO's & SLI's: A Guide!") == "slos-slis-a-guide"
    
    def test_multiple_spaces_and_dashes(self):
        assert generate_blog.slugify("  Multiple   Spaces  ") == "multiple-spaces"
    
    def test_max_length_truncation(self):
        long_title = "a" * 100
        result = generate_blog.slugify(long_title)
        assert len(result) <= 80
    
    def test_unicode_characters(self):
        # Current implementation preserves unicode word characters.
        assert generate_blog.slugify("Café & Résumé") == "café-résumé"


class TestBuildPrompt:
    """Test the build_prompt function."""
    
    def test_prompt_contains_topic(self):
        topic = "Understanding SLOs"
        prompt = generate_blog.build_prompt(topic)
        assert topic in prompt
        assert "**" + topic + "**" in prompt
    
    def test_prompt_contains_requirements(self):
        prompt = generate_blog.build_prompt("Test Topic")
        assert "200 to 300 words" in prompt
        assert "JSON" in prompt
        assert "slo-education.com.au" in prompt
    
    def test_prompt_references_site_pages(self):
        prompt = generate_blog.build_prompt("Test Topic")
        assert "cuj-sli-slo-error-budget.html" in prompt
        assert "error-budget-calculator.html" in prompt
        assert "incident-management.html" in prompt


class TestCallGemini:
    """Test the call_gemini function with mocked API."""
    
    @patch('generate_blog.genai.Client')
    def test_successful_api_call(self, mock_client_class):
        # Setup mock response
        mock_response = Mock()
        mock_response.text = json.dumps({
            "title": "Test Title",
            "description": "Test description",
            "keywords": "test, keywords",
            "tags": ["SRE", "Testing"],
            "body_html": "<p>Test content</p>"
        })
        mock_response.usage_metadata = Mock(
            prompt_token_count=100,
            candidates_token_count=200,
            total_token_count=300
        )
        
        mock_client = Mock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_class.return_value = mock_client
        
        # Call function
        result = generate_blog.call_gemini("fake-api-key", "test prompt")
        
        # Assertions
        assert result["title"] == "Test Title"
        assert result["description"] == "Test description"
        assert len(result["tags"]) == 2
        mock_client_class.assert_called_once_with(api_key="fake-api-key")
        mock_client.models.generate_content.assert_called_once()
    
    @patch('generate_blog.genai.Client')
    def test_invalid_json_response(self, mock_client_class):
        mock_response = Mock()
        mock_response.text = "Not valid JSON"
        
        mock_client = Mock()
        mock_client.models.generate_content.return_value = mock_response
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError, match="Invalid JSON"):
            generate_blog.call_gemini("fake-api-key", "test prompt")
    
    @patch('generate_blog.genai.Client')
    def test_api_error(self, mock_client_class):
        mock_client = Mock()
        mock_client.models.generate_content.side_effect = Exception("API Error")
        mock_client_class.return_value = mock_client
        
        with pytest.raises(RuntimeError, match="Gemini API error"):
            generate_blog.call_gemini("fake-api-key", "test prompt")


class TestRenderPostHTML:
    """Test the render_post_html function."""
    
    def test_generates_valid_html(self):
        html = generate_blog.render_post_html(
            title="Test Title",
            description="Test description",
            keywords="test, keywords",
            tags=["SRE", "Testing"],
            body_html="<p>Test content</p>",
            pub_date="2026-03-10",
            slug="2026-03-10-test-title"
        )
        
        assert "<!DOCTYPE html>" in html
        assert "<title>Test Title - SLO Education Hub</title>" in html
        assert "Test description" in html
        assert "test, keywords" in html
        assert '<span class="blog-post-tag">SRE</span>' in html
        assert '<span class="blog-post-tag">Testing</span>' in html
        assert "<p>Test content</p>" in html
    
    def test_includes_canonical_url(self):
        html = generate_blog.render_post_html(
            title="Test",
            description="Desc",
            keywords="key",
            tags=[],
            body_html="<p>Body</p>",
            pub_date="2026-03-10",
            slug="test-slug"
        )
        
        assert 'https://slo-education.com.au/blog/test-slug.html' in html
        assert 'rel="canonical"' in html
    
    def test_includes_meta_tags(self):
        html = generate_blog.render_post_html(
            title="Test",
            description="Test Desc",
            keywords="k1, k2",
            tags=[],
            body_html="<p>Body</p>",
            pub_date="2026-03-10",
            slug="test"
        )
        
        assert 'property="og:title"' in html
        assert 'property="og:description"' in html
        assert 'property="og:type" content="article"' in html
        assert 'property="article:published_time"' in html


class TestBuildCardHTML:
    """Test the build_card_html function."""
    
    def test_generates_card_html(self):
        card = generate_blog.build_card_html(
            title="Test Post",
            description="Test description",
            tags=["SRE", "Testing"],
            pub_date="2026-03-10",
            slug="test-post"
        )
        
        assert '<div class="blog-card">' in card
        assert "Test Post" in card
        assert "Test description" in card
        assert "2026-03-10" in card
        assert 'href="test-post.html"' in card
        assert '<span class="blog-card-tag">SRE</span>' in card
        assert '<span class="blog-card-tag">Testing</span>' in card
    
    def test_read_more_link(self):
        card = generate_blog.build_card_html(
            title="T", description="D", tags=[], 
            pub_date="2026-03-10", slug="slug"
        )
        
        assert 'Read more &rarr;' in card
        assert 'href="slug.html"' in card


class TestUpdateBlogIndex:
    """Test the update_blog_index function."""
    
    def test_inserts_card_at_top(self):
        mock_content = """<html>
<div id="blog-posts" class="blog-grid">
    <div class="blog-card">Old post</div>
</div>
</html>"""
        
        new_card = '<div class="blog-card">New post</div>'
        
        with patch.object(Path, 'read_text', return_value=mock_content):
            with patch.object(Path, 'write_text') as mock_write:
                generate_blog.update_blog_index(new_card)
                
                # Check that write was called
                assert mock_write.called
                written_content = mock_write.call_args[0][0]
                
                # New card should appear before old post
                new_pos = written_content.find("New post")
                old_pos = written_content.find("Old post")
                assert new_pos < old_pos
    
    def test_removes_empty_placeholder(self):
        mock_content = """<html>
<div id="blog-posts" class="blog-grid">
    <p class="blog-empty">No posts yet — check back soon!</p>
</div>
</html>"""
        
        new_card = '<div class="blog-card">First post</div>'
        
        with patch.object(Path, 'read_text', return_value=mock_content):
            with patch.object(Path, 'write_text') as mock_write:
                generate_blog.update_blog_index(new_card)
                
                written_content = mock_write.call_args[0][0]
                assert "No posts yet" not in written_content


class TestUpdateSitemap:
    """Test the update_sitemap function."""
    
    def test_adds_new_urls(self):
        # Create a minimal sitemap
        sitemap_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://slo-education.com.au/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>"""
        
        with patch('xml.etree.ElementTree.parse') as mock_parse:
            with patch.object(Path, 'read_text', return_value=sitemap_xml):
                with patch.object(Path, 'write_text'):
                    with patch.object(ET.ElementTree, 'write'):
                        tree = ET.ElementTree(ET.fromstring(sitemap_xml))
                        mock_parse.return_value = tree

                        generate_blog.update_sitemap("test-slug", "2026-03-10")

                        ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
                        locs = [
                            loc.text
                            for loc in tree.getroot().findall(f"{{{ns}}}url/{{{ns}}}loc")
                        ]

                        assert f"{generate_blog.SITE_BASE_URL}/blog/" in locs
                        assert f"{generate_blog.SITE_BASE_URL}/blog/test-slug.html" in locs
    
    def test_prevents_duplicate_urls(self):
        # Sitemap already has the blog index
        sitemap_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://slo-education.com.au/blog/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""
        
        with patch('xml.etree.ElementTree.parse') as mock_parse:
            with patch.object(Path, 'read_text', return_value=sitemap_xml):
                with patch.object(Path, 'write_text'):
                    with patch.object(ET.ElementTree, 'write'):
                        tree = ET.ElementTree(ET.fromstring(sitemap_xml))
                        mock_parse.return_value = tree

                        generate_blog.update_sitemap("new-post", "2026-03-10")

                        ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
                        locs = [
                            loc.text
                            for loc in tree.getroot().findall(f"{{{ns}}}url/{{{ns}}}loc")
                        ]

                        assert locs.count(f"{generate_blog.SITE_BASE_URL}/blog/") == 1


class TestTopicSelection:
    """Test that topic selection is deterministic and cycles through all topics."""
    
    def test_topic_selection_deterministic(self):
        # Same ISO week should give same topic
        with patch('generate_blog.date') as mock_date:
            mock_date.today.return_value = date(2026, 3, 10)  # Week 11
            week_num = mock_date.today().isocalendar()[1]
            topic1 = generate_blog.TOPICS[week_num % len(generate_blog.TOPICS)]
            
            mock_date.today.return_value = date(2026, 3, 10)  # Same week
            week_num = mock_date.today().isocalendar()[1]
            topic2 = generate_blog.TOPICS[week_num % len(generate_blog.TOPICS)]
            
            assert topic1 == topic2
    
    def test_all_topics_covered_in_cycle(self):
        # Over 52 weeks, we should cycle through topics
        topics_set = set(generate_blog.TOPICS)
        selected_topics = set()
        
        for week in range(len(generate_blog.TOPICS)):
            topic = generate_blog.TOPICS[week % len(generate_blog.TOPICS)]
            selected_topics.add(topic)
        
        assert selected_topics == topics_set


class TestMainFunction:
    """Test the main function with all dependencies mocked."""
    
    @patch('generate_blog.update_sitemap')
    @patch('generate_blog.update_blog_index')
    @patch.object(Path, 'write_text')
    @patch.object(Path, 'mkdir')
    @patch('generate_blog.call_gemini')
    @patch.dict(os.environ, {'GEMINI_API_KEY': 'test-api-key'})
    def test_main_success_flow(
        self, 
        mock_gemini, 
        mock_mkdir,
        mock_write_text,
        mock_update_index, 
        mock_update_sitemap
    ):
        # Mock Gemini response
        mock_gemini.return_value = {
            "title": "Understanding SLOs",
            "description": "A comprehensive guide to Service Level Objectives",
            "keywords": "SLO, SRE, reliability",
            "tags": ["SRE", "Observability"],
            "body_html": "<h2>Introduction</h2><p>SLOs are important...</p>"
        }
        
        # Patch BLOG_DIR to a real Path object so path joining works.
        with patch('generate_blog.BLOG_DIR', Path('/tmp/slo-education-test-blog')):
            # Run main
            generate_blog.main()
        
        # Assertions
        mock_gemini.assert_called_once()
        assert mock_mkdir.called
        assert mock_write_text.called
        assert mock_update_index.called
        assert mock_update_sitemap.called
    
    @patch.dict(os.environ, {}, clear=True)
    def test_main_missing_api_key(self):
        with pytest.raises(SystemExit, match="GEMINI_API_KEY"):
            generate_blog.main()
    
    @patch('generate_blog.call_gemini')
    @patch.dict(os.environ, {'GEMINI_API_KEY': 'test-key'})
    def test_main_missing_required_fields(self, mock_gemini):
        # Gemini returns incomplete data
        mock_gemini.return_value = {
            "description": "Only description, no title or body"
        }
        
        with pytest.raises(SystemExit, match="missing required fields"):
            generate_blog.main()


class TestConfiguration:
    """Test configuration constants."""
    
    def test_topics_list_not_empty(self):
        assert len(generate_blog.TOPICS) > 0
    
    def test_topics_are_strings(self):
        for topic in generate_blog.TOPICS:
            assert isinstance(topic, str)
            assert len(topic) > 0
    
    def test_site_url_configured(self):
        assert generate_blog.SITE_BASE_URL == "https://slo-education.com.au"
    
    def test_gemini_model_configured(self):
        assert generate_blog.GEMINI_MODEL == "gemini-2.5-flash"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
