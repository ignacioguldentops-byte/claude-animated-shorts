# one clause with a Microsoft neural voice through the session proxy: python3 edge_one.py <voice> <rate> <out.mp3> <text>
import sys, os, asyncio, certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
import edge_tts
async def main():
    voice, rate, out, text = sys.argv[1:5]
    c = edge_tts.Communicate(text, voice, rate=rate, proxy=os.environ.get("HTTPS_PROXY"))
    await c.save(out)
asyncio.run(main())
