# Battleship Game - React Frontend 

Welcome to the Battleship Game frontend repository! This project provides a user-friendly interface for playing the classic game of Battleship online. It features real-time gameplay, user authentication, and a modern React-based architecture. Get ready to sink some ships!

## Features

- **User Authentication**: Secure login and registration to manage user accounts. 
- **Real-time Gameplay**: Utilizes WebSockets for instant communication between players and the backend. 
- **Game Lobby**: Create and join game rooms to play with friends or random opponents. 
- **Interactive Game Board**: Intuitive interface for placing ships and targeting opponents. 
- **Chat Functionality**: Communicate with your opponent during the game. 
- **Leaderboard**: View the top players and their scores. 
- **Game History**: Track your past games and performance. 
- **Responsive Design**: Playable on various devices and screen sizes. 

## Tech Stack

Here's a breakdown of the technologies used in this project:

| Category    | Technology                 | Description                                                                  |
|-------------|----------------------------|------------------------------------------------------------------------------|
| **Frontend**  | React                      | Core library for building the user interface.                               |
|             | React Router DOM           | For handling navigation and routing within the application.                  |
|             | Craco                      | Used to configure the Create React App (CRA) build process without ejecting. |
|             | WebSockets                 | Enables real-time communication with the backend.                            |
|             | Custom UI Components       | Reusable UI elements built in-house (likely using Radix UI or Shadcn UI).   |
|             | Sonner                     | For displaying toast notifications.                                          |
|             | Lucide React               | For icons.                                                                   |
|             | CSS                        | Styling for the application.                                                 |
|             | HTML                       | Markup for the application structure.                                        |
|             | JavaScript                 | Programming language for the application logic.                              |
| **Other**     | Webpack                    | Module bundler.                                                              |
|             | Babel                      | JavaScript compiler.                                                         |
|             | Node.js                    | Runtime environment for JavaScript.                                          |
|             | npm/Yarn/pnpm              | Package manager.                                                             |
|             | rrweb                      | Library for recording and replaying user sessions.                           |
|             | Emergent                   | Integration with the Emergent platform.                                      |
| **Build Tools** | dotenv                     | For loading environment variables from a `.env` file.                       |

## Installation

Follow these steps to get the project up and running on your local machine:

### Prerequisites

- Node.js (version >= 18)
- npm or yarn or pnpm

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd frontend
    ```

2.  Install the dependencies:

    ```bash
    npm install # or yarn install or pnpm install
    ```

3.  Create a `.env` file in the root directory of the `frontend` folder. Add the following environment variables, replacing the values with your actual backend URL:

    ```
    REACT_APP_BACKEND_URL=http://localhost:8000 # Replace with your backend URL
    REACT_APP_WS_URL=ws://localhost:8000 # Replace with your backend WebSocket URL
    ```

    *Note:* Ensure your backend server is running and accessible at the specified URL.

## Running locally

1.  Start the development server:

    ```bash
    npm start # or yarn start or pnpm start
    ```

2.  Open your browser and navigate to `http://localhost:3000` (or the port specified by your environment).

## Project Structure

```
frontend/
├── public/                # Static assets and HTML template
│   ├── index.html         # Main HTML entry point
│   └── ...
├── src/                   # Source code
│   ├── App.js             # Main application component
│   ├── index.js           # Entry point for React rendering
│   ├── App.css            # Global styles
│   ├── index.css          # Global styles
│   ├── pages/             # Page components
│   │   ├── LandingPage.js # Login and registration page
│   │   ├── Lobby.js       # Game lobby
│   │   ├── Game.js        # Main game page
│   │   ├── Leaderboard.js # Leaderboard page
│   │   ├── History.js     # Game history page
│   │   └── ...
│   ├── components/        # Reusable components
│   │   ├── ui/            # Custom UI components
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── card.jsx
│   │   │   └── ...
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   ├── use-toast.js   # Custom toast hook
│   │   └── ...
│   ├── lib/               # Utility functions
│   │   ├── utils.js       # Utility functions (e.g., data formatting)
│   │   └── ...
│   └── ...
├── craco.config.js      # Craco configuration file
├── package.json         # Project dependencies and scripts
├── README.md            # This file
└── ...
```

## Screenshots

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and commit them with descriptive messages.
4.  Push your changes to your fork.
5.  Submit a pull request.

## License

## Contact

## Thanks Message
Thank you for checking out the Battleship Game frontend! We hope you enjoy playing and contributing to the project. Happy coding!
