import unittest
import sys
from tests.test_server import TestServer

def run_tests():
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestServer)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)