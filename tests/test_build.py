import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('builder', Path(__file__).parents[1] / 'scripts/build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.original = builder.ROOT
        builder.ROOT = Path(self.temp.name)
        self.addCleanup(setattr, builder, 'ROOT', self.original)
        self.data = {'slug': 'test-build', 'title': '<script>bad</script>', 'summary': 'A & B', 'weapon': 'Verified weapon', 'weapon_type': 'Bowgun', 'armor': ['Head: verified'], 'skills': ['Skill: Level 1'], 'notes': [], 'rotation': [], 'screenshots': [{'file': 'loadout.png', 'alt': 'Equipment "details"', 'caption': 'Source image'}]}
        folder = builder.ROOT / 'assets/builds/test-build'
        folder.mkdir(parents=True)
        (folder / 'loadout.png').write_bytes(b'fixture')
        (builder.ROOT / 'data/builds').mkdir(parents=True)

    def test_page_library_and_escaping(self):
        (builder.ROOT / 'data/builds/test-build.json').write_text(json.dumps(self.data))
        result = builder.outputs()
        page = result[builder.ROOT / 'builds/test-build.html']
        library = result[builder.ROOT / 'builds/index.html']
        self.assertIn('test-build.html', library)
        self.assertIn('../index.html', library)
        self.assertNotIn('<script>bad</script>', page)
        self.assertIn('&lt;script&gt;bad&lt;/script&gt;', page)
        self.assertIn('../assets/builds/test-build/loadout.png', page)
        self.assertIn('Equipment &quot;details&quot;', page)
        self.assertNotIn('<h2>Combat rotation</h2>', page)
        self.assertEqual(result, builder.outputs())

    def test_reject_missing_screenshot(self):
        self.data['screenshots'][0]['file'] = 'missing.png'
        with self.assertRaises(ValueError):
            builder.validate(self.data)

    def test_reject_path_traversal_and_reserved_slug(self):
        for slug in ['../escape', 'index', 'bad/name']:
            with self.subTest(slug=slug):
                self.data['slug'] = slug
                with self.assertRaises(ValueError):
                    builder.validate(self.data)
        self.data['slug'] = 'test-build'
        self.data['screenshots'][0]['file'] = '../other.png'
        with self.assertRaises(ValueError):
            builder.validate(self.data)

    def test_reject_invalid_content(self):
        self.data['skills'] = 'not a list'
        with self.assertRaises(ValueError):
            builder.validate(self.data)

    def test_progression_separates_equipped_and_target(self):
        self.data['progression'] = {'skill': 'Fire Damage Up', 'current': '6/7', 'target': '7/7', 'note': 'Target supplied by author <not equipped>'}
        self.data['character_stats'] = ['Physical Attack: 679']
        self.data['visage'] = ['Ink of Flames 4/4']
        self.data['buddy'] = ['SSR Kojiro']
        page = builder.page(builder.validate(self.data))
        self.assertIn('Current · screenshot<strong>6/7</strong>', page)
        self.assertIn('Fully upgraded · author target<strong>7/7</strong>', page)
        self.assertIn('&lt;not equipped&gt;', page)
        for value in ['Physical Attack: 679', 'Ink of Flames 4/4', 'SSR Kojiro']:
            self.assertIn(value, page)
        del self.data['progression']['target']
        with self.assertRaises(ValueError):
            builder.validate(self.data)

if __name__ == '__main__':
    unittest.main()
