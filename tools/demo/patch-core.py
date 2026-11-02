"""Demo conveniences in a scratch checkout of Core (never commit them to Core).

python3 patch-core.py <core-checkout>
- ?mock= takes several modes separated by commas;
- mock=qr turns QR sign-in on.
"""
import sys
from pathlib import Path

core = Path(sys.argv[1])

entry = core / "frontend/src/docsDemoEntry.ts"
s = entry.read_text()
old = "  applyPreviewMock(mockMode);"
if old in s:
    s = s.replace(old, '  for (const m of String(mockMode || "").split(",")) applyPreviewMock(m);')
    entry.write_text(s)
    print("mock list: on")

scenarios = core / "frontend/src/lib/webapp/previewMock/scenarios.ts"
s = scenarios.read_text()
head = 'export function applyPreviewMock(kind: unknown): void {\n  const mode = String(kind || "")\n    .trim()\n    .toLowerCase();\n'
if head in s and 'mode === "qr"' not in s:
    s = s.replace(head, head + (
        '  if (mode === "qr") {\n'
        '    const st = DEV_MOCK.data.settings as Record<string, unknown>;\n'
        '    st.auth_providers = [...((st.auth_providers as string[]) || ["telegram", "email"]), "qr"];\n'
        '    st.public_url = "https://app.avio.im";\n'
        '    return;\n'
        '  }\n'))
    scenarios.write_text(s)
    print("mock=qr: on")
