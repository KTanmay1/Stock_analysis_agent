class BaseAgent:
    def __init__(self):
        pass

    def log(self, message: str):
        print(f"[{self.__class__.__name__}] {message}")