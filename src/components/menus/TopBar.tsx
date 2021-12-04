import React, { createRef, forwardRef, useState, useEffect } from "react";
import type { RefObject, ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import format from "date-fns/format";

import type { MacActions, RootReduxState } from "../../types";
import AppleMenu from "./AppleMenu";
import WifiMenu from "./WifiMenu";
import ControlCenterMenu from "./ControlCenterMenu";
import { isFullScreen } from "../../utils";
import { setVolume, setBrightness, toggleFullScreen } from "../../redux/action";
import { music } from "../../configs";
import { useAudio, useWindowSize, useInterval } from "../../hooks";

// ------- import icons -------
import { BsBatteryFull } from "react-icons/bs";
import { BiSearch } from "react-icons/bi";
import { FaWifi } from "react-icons/fa";
import { RiSignalWifiLine } from "react-icons/ri";
import { AiFillApple } from "react-icons/ai";

interface TopBarItemProps {
  hideOnMobile?: boolean;
  forceHover?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const TopBarItem = forwardRef((props: TopBarItemProps, ref: any) => {
  const hide = props.hideOnMobile ? "hidden sm:inline-flex" : "inline-flex";
  const hover = props.forceHover
    ? "bg-white bg-opacity-30"
    : "hover:bg-white hover:bg-opacity-30 rounded";
  return (
    <div
      ref={ref}
      className={`${hide} cursor-default flex-row space-x-1 ${hover} p-1`}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
});

interface TopBarProps extends MacActions {
  title: string;
  setSpotlightBtnRef: (value: RefObject<HTMLDivElement>) => void;
  hide: boolean;
  toggleSpotlight: () => void;
}

interface TopBarState {
  date: Date;
  showControlCenter: boolean;
  showWifiMenu: boolean;
  showAppleMenu: boolean;
}

const TopBar = (props: TopBarProps) => {
  const appleBtnRef = createRef<HTMLDivElement>();
  const controlCenterBtnRef = createRef<HTMLDivElement>();
  const wifiBtnRef = createRef<HTMLDivElement>();
  const spotlightBtnRef = createRef<HTMLDivElement>();

  const [state, setState] = useState<TopBarState>({
    date: new Date(),
    showControlCenter: false,
    showWifiMenu: false,
    showAppleMenu: false
  });

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [audio, audioState, controls, audioRef] = useAudio({
    src: music.audio,
    autoReplay: true
  });
  const { winWidth, winHeight } = useWindowSize();

  const { volume, wifi } = useSelector((state: RootReduxState) => ({
    volume: state.volume,
    wifi: state.wifi
  }));
  const dispatch = useDispatch();

  useInterval(() => {
    setState({
      ...state,
      date: new Date()
    });
  }, 60 * 1000);

  useEffect(() => {
    props.setSpotlightBtnRef(spotlightBtnRef);
    controls.volume(volume / 100);
  }, []);

  useEffect(() => {
    const isFull = isFullScreen();
    dispatch(toggleFullScreen(isFull));
  }, [winWidth, winHeight]);

  const setAudioVolume = (value: number): void => {
    dispatch(setVolume(value));
    controls.volume(value / 100);
  };

  const setSiteBrightness = (value: number): void => {
    dispatch(setBrightness(value));
  };

  const toggleControlCenter = (): void => {
    setState({
      ...state,
      showControlCenter: !state.showControlCenter
    });
  };

  const toggleAppleMenu = (): void => {
    setState({
      ...state,
      showAppleMenu: !state.showAppleMenu
    });
  };

  const toggleWifiMenu = (): void => {
    setState({
      ...state,
      showWifiMenu: !state.showWifiMenu
    });
  };

  const logout = (): void => {
    controls.pause();
    props.setLogin(false);
  };

  const shut = (e: React.MouseEvent<HTMLLIElement>): void => {
    controls.pause();
    props.shutMac(e);
  };

  const restart = (e: React.MouseEvent<HTMLLIElement>): void => {
    controls.pause();
    props.restartMac(e);
  };

  const sleep = (e: React.MouseEvent<HTMLLIElement>): void => {
    controls.pause();
    props.sleepMac(e);
  };

  return (
    <div
      className={`nightwind-prevent w-full h-6 px-4 fixed top-0 flex flex-row justify-between items-center ${
        props.hide ? "z-0" : "z-20"
      } text-sm text-white bg-gray-500 bg-opacity-10 blur shadow transition`}
    >
      <div className="flex flex-row items-center space-x-4">
        <TopBarItem
          forceHover={state.showAppleMenu}
          onClick={() => toggleAppleMenu()}
          ref={appleBtnRef}
        >
          <AiFillApple size={18} />
        </TopBarItem>
        <span className="cursor-default font-semibold">{props.title}</span>
      </div>

      {/* Open this when clicking on Apple logo */}
      {state.showAppleMenu && (
        <AppleMenu
          logout={logout}
          shut={shut}
          restart={restart}
          sleep={sleep}
          toggleAppleMenu={toggleAppleMenu}
          btnRef={appleBtnRef}
        />
      )}

      <div className="flex flex-row justify-end items-center space-x-2">
        <TopBarItem hideOnMobile={true}>
          <span className="text-xs mt-0.5 mr-1">100%</span>
          <BsBatteryFull size={20} />
        </TopBarItem>
        <TopBarItem
          hideOnMobile={true}
          onClick={toggleWifiMenu}
          ref={wifiBtnRef}
        >
          {wifi ? <FaWifi size={17} /> : <RiSignalWifiLine size={17} />}
        </TopBarItem>
        <TopBarItem ref={spotlightBtnRef} onClick={props.toggleSpotlight}>
          <BiSearch size={17} />
        </TopBarItem>
        <TopBarItem onClick={toggleControlCenter} ref={controlCenterBtnRef}>
          <img
            className="w-4 h-4 filter invert"
            src="img/icons/menu/controlcenter.png"
            alt="control center"
          />
        </TopBarItem>

        {/* Open this when clicking on Wifi button */}
        {state.showWifiMenu && (
          <WifiMenu toggleWifiMenu={toggleWifiMenu} btnRef={wifiBtnRef} />
        )}

        {/* Open this when clicking on Control Center button */}
        {state.showControlCenter && (
          <ControlCenterMenu
            playing={audioState.playing}
            toggleAudio={controls.toggle}
            setVolume={setAudioVolume}
            setBrightness={setSiteBrightness}
            toggleControlCenter={toggleControlCenter}
            btnRef={controlCenterBtnRef}
          />
        )}

        <span>{format(state.date, "eee MMM d")}</span>
        <span>{format(state.date, "h:mm aa")}</span>
      </div>
    </div>
  );
};

export default TopBar;