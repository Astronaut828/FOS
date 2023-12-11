import { useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";
import { useAccount } from "wagmi";
import {
  useAnimationConfig,
  useScaffoldContract,
  useScaffoldContractRead,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";

const MARQUEE_PERIOD_IN_SEC = 5;

export const ContractData = () => {
  const { address } = useAccount();
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isRightDirection, setIsRightDirection] = useState(false);
  const [marqueeSpeed, setMarqueeSpeed] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);

  const [userCIDs, setUserCIDs] = useState<string[]>([]);

  const { data: yourContract } = useScaffoldContract({ contractName: "YourContract" });


  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CidMapped",
    listener: logs => {
      logs.map(log => {
        const { user, index, cid } = log.args;
        console.log("📡 CidMapped event", user, index, cid);
      });
    },
  });

  // Hook to read the count of CIDs for a user
  const { data: cidCount } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDsCount",
    args: [address],
  });

  const { data: cidsData } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDs",
    args: [address, cidCount],
  });

  useEffect(() => {
    if (cidsData) {
      // Create a new array from the readonly array to make it mutable
      setUserCIDs([...cidsData]);
    }
  }, [cidsData]);

  const {
    data: myGreetingChangeEvents,
    isLoading: isLoadingEvents,
    error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "CidMapped",
    fromBlock: process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n,
    filters: { greetingSetter: address },
    blockData: true,
  });

  console.log("Events:", isLoadingEvents, errorReadingEvents, myGreetingChangeEvents);

  console.log("yourContract: ", yourContract);

  // const { showAnimation } = useAnimationConfig(totalCounter);

  // const showTransition = transitionEnabled && !!currentGreeting && !isGreetingLoading;

  useEffect(() => {
    if (transitionEnabled && containerRef.current && greetingRef.current) {
      setMarqueeSpeed(
        Math.max(greetingRef.current.clientWidth, containerRef.current.clientWidth) / MARQUEE_PERIOD_IN_SEC,
      );
    }
  }, [transitionEnabled, containerRef, greetingRef]);

  return (
<div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-10 mt-5 lg:py-auto w-full max-w-[98vw]">

      <div
        className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full"
        style={{ maxWidth: "95%" }}
      >


        <div className="flex justify-between w-full px-20">

          {/* Switch Button => turn NEXT POST (Last posts) (Pagination) */}
          <button
            className="btn btn-circle btn-ghost relative bg-center bg-[url('/assets/switch-button-on.png')] bg-no-repeat"
            onClick={() => {
              setTransitionEnabled(!transitionEnabled);
            }}
          >
            <div
              className={`absolute inset-0 bg-center bg-no-repeat bg-[url('/assets/switch-button-off.png')] transition-opacity ${
                transitionEnabled ? "opacity-0" : "opacity-100"
              }`}
            />
          </button> 
 


          {/* Post count */}
          <div className="border border-primary rounded-xl flex">
            <div className="p-2 py-1 border-r border-primary flex items-end">Post count</div>
            {/* <div className="text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree">
              {totalCounter?.toString() || "0"}
            </div> */}
          </div>


        </div>


        {/* Marquee Text */}
        <div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-10 mt-5 lg:py-auto w-full max-w-[98vw]">
          <div className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full" style={{ maxWidth: "95%" }}>
            {/* ... other UI elements ... */}
            {/* Marquee Text */}
            <div className="mt-3 border border-primary bg-neutral bg-opacity-70 rounded-3xl text-secondary overflow-hidden text-[116px] whitespace-nowrap w-full uppercase tracking-tighter font-bai-jamjuree leading-tight">
              {userCIDs.map((cid, index) => (
                <Marquee key={index} /* ... other Marquee props */>
                  {cid}
                </Marquee>
              ))}
            </div>
            {/* ... other UI elements ... */}
          </div>
        </div>

        {/* Marquee direction button + Loading Bar

         <div className="mt-3 flex bg-yellow-500 items-end justify-between">

          <button
            className={`btn btn-circle btn-ghost border border-primary hover:border-primary w-12 h-12 p-1 bg-neutral flex items-center ${
              isRightDirection ? "justify-start" : "justify-end"
            }`}
            onClick={() => {
              if (transitionEnabled) {
                setIsRightDirection(!isRightDirection);
              }
            }}
          >
            <div className="border border-primary rounded-full bg-secondary w-2 h-2" />
          </button>


          <div className="w-44 p-0.5 flex items-center bg-neutral border border-primary rounded-full">
            <div
              className="h-1.5 border border-primary rounded-full bg-secondary animate-grow"
              style={{ animationPlayState: showTransition ? "running" : "paused" }}
            />
          </div>


        </div>

         */}

      </div>
    </div>
  );
};
