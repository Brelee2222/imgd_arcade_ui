import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import useInput from '../../components/GamepadAPI';
import { useEffect, useState } from 'react';

const isProd: boolean = process.env.NODE_ENV === 'production';
const TIMER_INTERVAL = 100;

const GamePage: NextPage = () => {
  const router = useRouter();
  const embed: string = ""+router.query.embed;

  const [delay, setDelay] = useState<NodeJS.Timeout | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState<number>(new Date().getTime());
  const [evt, setEvt] = useState({value: 0});

  // 5s timer for holding down esc to return to menu + debug message
  useInput({
    "home": { keyCode: "Escape", buttonIndex: 11 },
}, (evt) => {
    console.log(evt);
    setEvt(evt);
}, true);

  useEffect(() => {
    if(evt.value == 1 && !delay) {
      const time = (timeLeft: number) => {
        setTimeLeft(timeLeft)
        if(timeLeft <= 0) {
          window.location.href = isProd ? "app://./home.html" : "/home";
        } else {
          setDelay(setTimeout(() => time(timeLeft - TIMER_INTERVAL), TIMER_INTERVAL));
        }
      };
      setDelay(setTimeout(() => time(5000), TIMER_INTERVAL));
    } else if(evt.value == 0 && delay) {
      clearTimeout(delay);
      setDelay(undefined);
      setTimeLeft(5000);
    }
  }, [evt]);

  const preload = typeof window !== 'undefined'
    ? (window as any).electronPaths?.itchPreload
    : undefined;

  return <>
    <style>{`
      html {
        overflow: hidden;
      }
    `}
    </style>
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#333333" }}>
      <p style={{ paddingLeft: 160, paddingTop: 15 }}>
        Hold top left button for {delay ? <b>{(timeLeft/1000).toFixed(1)}</b> : " 5 "} seconds to go return to game selection screen
      </p>

      {embed ? (
        <webview
          src={`${embed}${embed.includes("?") ? "&" : "?"}arcade`}
          style={{ width: "100%", height: "90%", border: "none", backgroundColor: "#333333" }}
          preload={preload}
          webpreferences="contextIsolation=yes"
        />
      ) : null}
    </div>
  </>
}
export default GamePage;
