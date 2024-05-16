from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import subprocess
import asyncio

import sys
from threading import Thread
from queue import Queue, Empty
import tkinter as tk
from tkinter import filedialog

ON_POSIX = 'posix' in sys.builtin_module_names

def enqueue_output(out, queue):
    for line in iter(out.readline, b''):
        queue.put(line)
    out.close()

class EngineChess:
    def __init__(self, path_engine):
        self._stockfish = subprocess.Popen(
            path_engine,
            universal_newlines=True,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        self.queueOutput = Queue()
        self.thread = Thread(target=enqueue_output, args=(self._stockfish.stdout, self.queueOutput))
        self.thread.daemon = True # thread dies with the program
        self.thread.start()
        
        self._has_quit_command_been_sent = False
        self._debug_view = False

    def _put(self, command):
        if not self._stockfish.stdin:
            raise BrokenPipeError()
        if self._stockfish.poll() is None and not self._has_quit_command_been_sent:
            if self._debug_view:
                print(f">>> {command}\n")
            self._stockfish.stdin.write(f"{command}\n")
            self._stockfish.stdin.flush()
            if command == "quit":
                self._has_quit_command_been_sent = True
    
    def _read_line(self) -> str:
        if not self._stockfish.stdout:
            raise BrokenPipeError()
        if self._stockfish.poll() is not None:
            raise StockfishException("The Stockfish process has crashed")
            
        try:
            line = self.queueOutput.get_nowait() # or q.get(timeout=.1)
        except Empty:
            return ""
        
        if self._debug_view:
            print(line.strip())
        return line.strip()
    
    def _is_ready(self) -> None:
        self._put("isready")
        while self._read_line() != "readyok":
            pass
    
    def put(self, cmd):
        return self._put(cmd)
        
    def read_line(self) -> str:
        return self._read_line()

# Initialize Tkinter
root = tk.Tk()
root.withdraw()  # Hide the main window

# Prompt the user to select the engine executable file
engine_exe_path = filedialog.askopenfilename(title="Select engine executable file")

if not engine_exe_path:
    print("No file selected. Exiting.")
    sys.exit()

app = FastAPI()
stockfish = EngineChess(engine_exe_path)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async def read_from_socket(websocket: WebSocket):
        async for data in websocket.iter_text():
            print(f"Client: {data}")
            stockfish.put(data)
                    
    asyncio.create_task(read_from_socket(websocket))

    while True:
        while True:
            res = stockfish.read_line()
            if res != "":
                await websocket.send_text(f"{res}")
            else:
                break
        await asyncio.sleep(0.1)

@app.get("/")
async def get():
    return HTMLResponse("""
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
""")
