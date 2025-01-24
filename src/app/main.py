from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}
