import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { create } from 'zustand'
import {
  useAnimationConfig,
  useScaffoldContract,
  useScaffoldContractRead,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";


export const ContractData = () => {
  const { address } = useAccount();
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  // CID Data
  const [userCIDs, setUserCIDs] = useState<string[]>([]);
  const [cidContents, setCidContents] = useState<CidContent[]>([]);

  const { data: yourContract } = useScaffoldContract({ contractName: "YourContract" });

  interface CidContent {
    cid: string;
    content: {
      text: string;
      timestamp?: string;
    };
  }

  const url = `https://bafybeiby7vdd4deanl7x4glioxv4fehwabwjbls74g5dkvtgkm5fcrkw5a.ipfs.nftstorage.link/blob`;


  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CidMapped",
    listener: (logs) => {
      logs.forEach((log) => {
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

  useEffect(() => {
    const fetchCidContents = async () => {
      const contents = await Promise.all(
        userCIDs.map(async (cid) => {
          try {
            // Using NFT.Storage gateway
            const url = `https://${cid}.ipfs.nftstorage.link/blob`;
            const response = await fetch(url);
  
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
  
            const data = await response.json();
            return { cid, content: data };
          } catch (error) {
            // Check if error is an instance of Error
            if (error instanceof Error) {
              console.error(`Error fetching CID ${cid}:`, error.message);
            } else {
              console.error(`Error fetching CID ${cid}:`, error);
            }
            
            return {
              cid,
              content: {
                text: `Error: Could not retrieve data for CID ${cid}`,
                timestamp: null
              }
            };
          }
        })
      );
      setCidContents(contents);
    };
  
    if (userCIDs.length > 0) {
      fetchCidContents();
    }
  }, [userCIDs]);


  // Use `myCidMappedEvents` to display a history of CID mappings for the user
  const {
    data: myCidMappedEvents,
    isLoading: isLoadingCidMappedEvents,
    error: errorReadingCidMappedEvents,
  } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "CidMapped",
    fromBlock: process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n,
    filters: { user: address }, // Filter events for the current user
    blockData: true,
  });
  
  

  // console.log("Events:", isLoadingEvents, errorReadingEvents, myGreetingChangeEvents);

  console.log("yourContract: ", yourContract);
  const { showAnimation } = useAnimationConfig(cidCount);

  return (
<div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-10 mt-5 lg:py-auto w-full max-w-[98vw]">

      <div
        className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full"
        style={{ maxWidth: "95%" }}
      >


        <div className="flex justify-between w-full px-20">

          {/* Switch Button => turn to NEXT POST (Last posts) (Pagination) */}
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
            <div className={`text-4xl text-right min-w-[3rem] px-2 py-1 flex justify-end font-bai-jamjuree ${showAnimation ? "animate-zoom" : ""}`}>
              {cidCount?.toString() || "0"} {/* Display the CID count here */}
            </div>
          </div>


        </div>


        {/* CID list */}
        <div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-10 mt-5 lg:py-auto w-full max-w-[98vw]">
          <div className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full" style={{ maxWidth: "95%" }}>
          
          <h3 className="text-lg font-bold mb-2">User CID's & Content:</h3>
          <ul className="list-disc list-inside">
              {address && cidContents.length > 0 ? (
                cidContents.map(({ cid, content }, index) => (
                  <li key={index}>
                    CID: {cid}
                    <br />
                    Content: {content.text}
                    <br />
                    Timestamp: {content.timestamp ? new Date(content.timestamp).toLocaleString() : 'Unavailable'}
                  </li>
                ))
              ) : (
                <li>{address ? 'No CIDs found.' : 'Not logged in.'}</li>
              )}
            </ul>
            {/* ... other UI elements ... */}
          </div>
        </div>


        {/*  Loading Bar

         <div className="mt-3 flex bg-yellow-500 items-end justify-between">

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
