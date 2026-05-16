import { useEffect, useRef } from "react";
import splashBg from "../../assets/hermesbg.webp";

interface SplashScreenProps {
  onFinished: () => void;
}

function SplashScreen({ onFinished }: SplashScreenProps): React.JSX.Element {
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onFinished();
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
    <div className="splash-screen">
      <img className="splash-bg" src={splashBg} alt="" />
      <div className="splash-logo splash-logo-text">
        <div className="splash-logo-title" ref={titleRef}>MERCURY</div>
        <div className="splash-logo-subtitle" ref={subtitleRef}>for Hermes Agent</div>
      </div>
    </div>
  );
}

export default SplashScreen;
