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
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

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

  // Function to show next post
  const showNextPost = () => {
    if (currentPostIndex < cidContents.length - 1) {
      setCurrentPostIndex(currentPostIndex + 1);
    }
  };

  // Function to show previous post
  const showPreviousPost = () => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
    }
  };

  // Get the current post
  const currentPost = cidContents[currentPostIndex];

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
      <div className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full" style={{ maxWidth: "95%" }}>

        {/* Pagination Buttons and Post Count */}
        <div className="flex justify-between w-full px-20 items-center">
          {/* Pagination Buttons */}
          <div className="flex gap-4">
            <button className="btn" onClick={showPreviousPost} disabled={currentPostIndex === 0}>Previous</button>
            <button className="btn" onClick={showNextPost} disabled={currentPostIndex === cidContents.length - 1}>Next</button>
          </div>
    
          {/* Post count */}
          <div className="border border-primary rounded-xl flex justify-center items-center">
            <div className="p-2 py-1 border-r border-primary">Post count</div>
            <div className={`text-4xl px-2 py-1 font-bai-jamjuree ${showAnimation ? "animate-zoom" : ""}`}>
              {cidCount?.toString() || "0"}
            </div>
          </div>
        </div>

        {/* CID list */}
        <div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-13 mt-5 lg:py-auto w-full max-w-[95vw]">
          
          <h3 className="text-lg font-bold mb-2">User CID's & Content:</h3>
            {/* Display the current post */}
            {address && cidContents.length > 0 ? (
              <div className="mt-2 p-4">
                {/* CID and Timestamp with emphasized labels */}
                <p className="text-m mb-2">
                  <strong>IPFS CID:</strong> {currentPost.cid} - 
                  <strong> Timestamp:</strong> {currentPost.content.timestamp ? new Date(currentPost.content.timestamp).toLocaleString() : 'Unavailable'}
                </p>

                {/* Post Content */}
                <div className="text-lg mt-5">
                  <strong>Content:</strong>
                  <p>{currentPost.content.text}</p>
                </div>
              </div>
            ) : (
              <p>{address ? 'No CIDs found.' : 'Not logged in.'}</p>
            )}
            {/* ... other UI elements ... */}

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
