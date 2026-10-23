"""Exercise named and wildcard crawler access, which robots groups do not inherit."""
from pathlib import Path
import unittest
from urllib.robotparser import RobotFileParser


class CrawlerAccess(unittest.TestCase):
    def test_search_agents_can_read_evidence_but_not_service_routes(self):
        robots = RobotFileParser()
        robots.parse((Path(__file__).parents[1] / 'public/robots.txt').read_text().splitlines())
        for agent in ['Googlebot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot',
                      'PerplexityBot', 'Bingbot', 'GPTBot', 'UnknownBot']:
            with self.subTest(agent=agent):
                for route in ['/', '/product-facts/', '/pdf-measuring-tool/',
                              '/samples/takeoff/flooring-mac-summary.pdf', '/static/js/main.js']:
                    self.assertTrue(robots.can_fetch(agent, 'https://www.polypdf.com' + route))
                for route in ['/api/commercial-offer', '/admin/example']:
                    self.assertFalse(robots.can_fetch(agent, 'https://www.polypdf.com' + route))

    def test_existing_scraper_policy_is_preserved(self):
        robots = RobotFileParser()
        robots.parse((Path(__file__).parents[1] / 'public/robots.txt').read_text().splitlines())
        for agent in ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot']:
            self.assertFalse(robots.can_fetch(agent, 'https://www.polypdf.com/product-facts/'))


if __name__ == '__main__':
    unittest.main()
