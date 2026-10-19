import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Head from 'next/head';
import React, { useEffect, useState } from 'react';

import useInput from "../components/GamepadAPI";
import { db } from '../lib/fb';
import { useRouter } from 'next/router';
import { collection, getDocs, query } from 'firebase/firestore';

const 
    COLUMN_SIZE = 3,
    SCROLL_HOME_DELAY = 30000,
    GAME_PAD_KEYBINDS = {
        // Arrow Keys (up and down end up scrolling the page as well)
        "left": { keyCode: "ArrowLeft" },
        "right": { keyCode: "ArrowRight" },
        "up": { keyCode: "ArrowUp" },
        "down": { keyCode: "ArrowDown" },

        // WASD
        "a": { keyCode: "a" },
        "d": { keyCode: "d" },
        "w": { keyCode: "w" },
        "s": { keyCode: "s" },

        // Joystick Axes
        "ax": { analogAxis: 0 },
        "ay": { analogAxis: 1 },

        // Buttons
        "home": { keyCode: "Escape", buttonIndex: 11 },
        "j": { keyCode: "j", buttonIndex: 3 },
        "k": { keyCode: "k", buttonIndex: 4 },
        "l": { keyCode: "l", buttonIndex: 1 },
    },

    IS_PROD: boolean = process.env.NODE_ENV === 'production';

const Root = styled('div')(({ theme }) => {
    return {
        textAlign: 'center',
        paddingTop: theme.spacing(4),
    };
})

function gameUrl(game: any) {
    const params = new URLSearchParams();
    if (game.gameId) params.append('gameId', game.gameId);
    if (game.embed) params.append('embed', game.embed);
    return IS_PROD ? `app://./game.html?${params.toString()}` : `/game?${params.toString()}`;
}

function Home() {
    const [loading, setLoading] = React.useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [games, setGames] = useState([]);
    const [evt, setEvt] = useState({ key: "", value: -1 });
    const [scrollHomeTimer, setScrollHomeTimer] = useState(-1);
    // const router = useRouter();
    // const handleClose = () => setOpen(false);
    // const handleClick = () => setOpen(true);
    // const [open, setOpen] = React.useState(false);

    // Initialization
    useEffect(onInitialize, []);

    // Event Handling
    useEffect(onInputEvent, [evt]); // Input event
    useEffect(resetScrollHomeTimer, [selectedGame]); // Selected game changed event
    useInput(GAME_PAD_KEYBINDS, onGamePadEvent, true); // Game-Pad Event

    //// Functions ////
    async function fetchGames() {
        setLoading(true);
        const q = query(collection(db, "/games"));
        const docs = await getDocs(q);
        const fetchedGames = docs.docs.map(doc => doc.data());

        // If the gameslist is empty, error
        if(fetchedGames.length == 0)
            throw new Error("Game list is empty");

        setGames(fetchedGames);
  
        setLoading(false);
    }

    function resetScrollHomeTimer() {
        // Set a new timer
        setScrollHomeTimer(window.setTimeout(
            () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setSelectedGame(null);
            },
            SCROLL_HOME_DELAY,
        ));

        // Cleanup
        return () => window.clearTimeout(scrollHomeTimer);
    };

    function selectGame(game: any | number) {
        // Game the game if given an index number
        if(typeof game === "number")
            game = games[((game % games.length) + games.length) % games.length] ?? games[0]; // Mods to a positive number

        setSelectedGame(game);

        try { document.getElementById(`game-${game.embed}`).focus(); }
        catch (e) { console.error(e); }
    }

    function onInitialize() {

        let waitTime = 15000;
        // Only repeats when the last fetch was unsuccessful
        let fetchGamesUntilSuccess: ()=>void = () => fetchGames().catch(async e => {
            console.warn(e);

            await new Promise(res => setTimeout(res, waitTime));
            waitTime *= 1.1; // Increase the wait time

            fetchGamesUntilSuccess();
        });
        fetchGamesUntilSuccess();

        return () => {
            fetchGamesUntilSuccess = () => {};
        }
    }

    function onInputEvent() {        
        if(!selectedGame) {
            selectGame(0);
            return;
        }

        const gameIndex = games.indexOf(selectedGame);

        const keyValue = `${evt.key} ${evt.value}`;

        switch (keyValue) {
            case "l 1":
            case "k 1":
                if(selectedGame)
                    window.location.href = gameUrl(selectedGame);
                break;

            case "down 1":
            case "s 1":
            case "ay 1":
                selectGame(gameIndex + COLUMN_SIZE);
                break;

            case "right 1":
            case "d 1":
            case "ax 1":
                selectGame(gameIndex + 1);
                break;

            case "left 1":
            case "a 1":
            case "ax -1":
                selectGame(gameIndex - 1);
                break;

            case "up 1":
            case "w 1":
            case "ay -1":
                selectGame(gameIndex - COLUMN_SIZE);
                break;
        }
    }

    function onGamePadEvent(event) {
        console.log(event);
        setEvt(event);
    }

    return (
        <React.Fragment>
            <Head>
                <title>IMGD Arcade</title>
                <style>
                    {`
                    .lds-dual-ring {
                    display: inline-block;
                    width: 80px;
                    height: 80px;
                    margin-right: auto;
                    margin-left: auto;
                    }
                    .lds-dual-ring:after {
                    content: " ";
                    display: block;
                    width: 64px;
                    height: 64px;
                    margin: 8px;
                    border-radius: 50%;
                    border: 6px solid #fff;
                    border-color: #fff transparent #fff transparent;
                    animation: lds-dual-ring 1.2s linear infinite;
                    }
                    @keyframes lds-dual-ring {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                    }
                `}
                </style>
            </Head>
            <Root>
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: 10, alignContent: "center" }}>
                    <img height="250" src="/images/imgd.png" />
                    <img height="220" style={{ borderRadius: 5 }} src="/images/qr-code.png" />
                    <img height="240" src="/images/joybox.png" />
                </div>
                <div style={{ background: "black", width: "100%", paddingTop: 15, paddingBottom: 5 }}>
                    <Typography variant="h3" gutterBottom>
                        IMGD Arcade <sup style={{ fontSize: 20 }}>v0.3</sup>
                    </Typography>
                </div>
                <br />
                <Typography variant="subtitle1" gutterBottom>
                    Add your games at:  https://imgdhub.wpi.edu/app/arcade
                </Typography>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLUMN_SIZE}, 1fr)`, justifyContent: "center", alignItems: "center" }}>
                    {loading && <div className='lds-dual-ring'></div>}
                    {games.map(g => {
                        const canvas2d = document.createElement("canvas").getContext('2d');
                        const cover = document.createElement("img");
                        cover.crossOrigin = "Anonymous";
                        // document.body.append(cover)
                        cover.src = g.cover;
                        canvas2d.drawImage(cover, 0, 0);
                        
                        // const rgb = canvas2d.getImageData(0, 0, 1, 1).data;
                        // const coverColor = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;

                        return <div key={g.embed} style={{ width: "100%", minHeight: 400, padding: "5%" }}>
                            <Button variant="contained"
                                color={g.gameId === selectedGame?.gameId ? "secondary" : "primary"}
                                id={`game-${g.embed}`}

                                // NOTE: hovering the causes the selected-color to be darker.
                                onMouseMove={() => selectGame(g)}

                                style={{ display: "flex", flexDirection: "column", gap: 15, padding: 15, paddingTop: 15, paddingBottom: 15 }}
                                href={gameUrl(g)}>
                                <span style={{
                                    width: "100%",
                                    height: 325,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    backgroundImage: `url(${g.cover})`,
                                    backgroundSize: "contain",
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "center",
                                    backgroundColor: "#121212",
                                }} />
                                <Typography>{g.title}</Typography>
                            </Button>
                        </div>
                    }
                    )}
                    {games.length <= 0 && <Typography variant="h5">
                        <br /><br />
                        No Games Available
                        <br /><br />
                        Want to add your own? Check out the link or QR code above!
                    </Typography>}
                </div>
            </Root>
        </React.Fragment>
    );
};

export default Home;
