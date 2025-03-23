# Vue Agent Chat UI

This is a draft implementation of a chat user interface built with Vue.js, inspired by and extended from the original [@langchain-ai/agent-chat-ui](https://github.com/langchain-ai/agent-chat-ui) React project. The goal is to provide the same functionality for chatting with LangGraph servers while leveraging Vue's reactive architecture and component system.

This project is in active development and contributions are highly encouraged! Whether you're interested in improving the UI, adding new features, or fixing bugs, your help would be greatly appreciated.

## Original Project

This project is based on the [LangChain Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui), which is a Vite + React application enabling chat with any LangGraph server.

## Setup

> [!TIP]
> Don't want to run the app locally? Use the deployed site here: [agentchat.vercel.app](https://agentchat.vercel.app)!

First, clone the repository:

```bash
git clone https://github.com/yourusername/vue-agent-chat-ui.git

cd vue-agent-chat-ui
```

Install dependencies:

```bash
pnpm install
```

Run the app:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

## Usage

Once the app is running, you'll be prompted to enter:

- **Deployment URL**: The URL of the LangGraph server you want to chat with. This can be a production or development URL.
- **Assistant/Graph ID**: The name of the graph, or ID of the assistant to use when fetching, and submitting runs via the chat interface.
- **LangSmith API Key**: (only required for connecting to deployed LangGraph servers) Your LangSmith API key to use when authenticating requests sent to LangGraph servers.

After entering these values, click `Continue`. You'll then be redirected to a chat interface where you can start chatting with your LangGraph server.

## Contributing

Contributions are welcome! This is a draft implementation and there's plenty of room for improvements and new features.
