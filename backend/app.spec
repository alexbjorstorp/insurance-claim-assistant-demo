# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the EYE on Claims demo .exe

block_cipher = None

a = Analysis(
    ['launcher.py'],
    pathex=['.'],
    binaries=[],
    datas=[
        # React build (copied here by CI before pyinstaller runs)
        ('static', 'static'),
    ],
    hiddenimports=[
        # uvicorn internals
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.loops.asyncio',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # passlib / bcrypt
        'passlib.handlers.bcrypt',
        'passlib.handlers.sha2_crypt',
        # SQLAlchemy
        'sqlalchemy.dialects.sqlite',
        'sqlalchemy.ext.declarative',
        # email-validator
        'email_validator',
        # app models (must be imported so SQLAlchemy metadata is populated)
        'app.models',
        'app.models.user',
        'app.models.case',
        'app.models.signal',
        'app.models.timeline',
        'app.models.logging',
        'app.models.behandelplan',
        'app.models.reserve',
        'app.models.comparable_case',
        # app routers
        'app.api.v1.auth',
        'app.api.v1.cases',
        'app.api.v1.signals',
        'app.api.v1.timeline',
        'app.api.v1.behandelplan',
        'app.api.v1.reserves',
        'app.api.v1.comparable_cases',
        'app.api.v1.import_routes',
        'app.api.v1.system',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'notebook', 'IPython'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='EYE-on-Claims',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,   # keep console visible so user can see "Starting…"
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
