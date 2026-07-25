import asyncio
from g4f.client import AsyncClient

async def main():
    client = AsyncClient()
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": "Say hello!"}]
        )
        print("RESPONSE:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", e)

asyncio.run(main())
