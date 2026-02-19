from dotenv import load_dotenv
from pathlib import Path
import os
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
print(f"DEBUG - Google Client ID: {os.getenv('GOOGLE_CLIENT_ID')}")
print(f"DEBUG - Google Secret exists: {bool(os.getenv('GOOGLE_CLIENT_SECRET'))}")

from authlib.integrations.starlette_client import OAuth  # noqa: E402
from starlette.config import Config  # noqa: E402

config = Config(environ=os.environ)

oauth = OAuth(config)

oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    authorize_url='https://github.com/login/oauth/authorize',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)
