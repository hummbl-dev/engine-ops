try:
    import chromadb
    print("✅ chromadb imported successfully")
    client = chromadb.PersistentClient(path="./test_db")
    print("✅ PersistentClient created")
except ImportError as e:
    print(f"❌ ImportError: {e}")
except Exception as e:
    print(f"❌ Exception: {e}")
