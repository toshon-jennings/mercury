import { useEffect, useRef, useState } from "react";
import logo from "../../assets/icon.png";

interface SplashScreenProps {
  onFinished: () => void;
}

function SplashScreen({ onFinished }: SplashScreenProps): React.JSX.Element {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show splash for 4s, then start fade out
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4000);

    // Call onFinished after fade out animation (1.2s)
    const finishTimer = setTimeout(() => {
      onFinished();
    }, 5200);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  useEffect(() => {
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    if (!title || !subtitle) return;
    const titleWidth = title.getBoundingClientRect().width;
    const subtitleWidth = subtitle.getBoundingClientRect().width;
    if (subtitleWidth > 0) {
      subtitle.style.transform = `scaleX(${titleWidth / subtitleWidth})`;
    }
  }, []);

  return (
    <div className={`splash-screen ${isExiting ? "is-exiting" : ""}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img src={logo} className="splash-logo-image" alt="Mercury Logo" />
        </div>
        <div className="splash-text-container">
          <div className="splash-logo-title" ref={titleRef}>
            MERCURY
          </div>
          <div className="splash-logo-subtitle" ref={subtitleRef}>
            for Hermes Agent
          </div>
        </div>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
