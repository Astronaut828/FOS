import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { create } from "zustand";
import { MetaHeader } from "~~/components/MetaHeader";
import {
  useAnimationConfig,
  useScaffoldContract,
  useScaffoldContractRead,
  useScaffoldContractWrite,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
} from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  // Importing the contract ABI
  const { data: yourContract } = useScaffoldContract({ contractName: "YourContract" });
  const { address } = useAccount();

  // Searchbar functionality
  const [searchAddress, setSearchAddress] = useState("");
  const [addressFound, setAddressFound] = useState(false);

  // Hook to read CIDs count for a user in the contract
  const { data: cidCountData } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDsCount",
    args: [searchAddress || undefined],
  });

  useEffect(() => {
    if (cidCountData !== undefined) {
      setAddressFound(cidCountData > 0);
    } else {
      setAddressFound(false);
    }
  }, [cidCountData]);

  // Hook to add a new follow record to the contract
  const { writeAsync: followAddressAsync } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "followAddress",
    args: [undefined],
  });

  const handleFollow = async (addressToFollow: string) => {
    try {
      await followAddressAsync({ args: [addressToFollow] });
      setSearchAddress("");
    } catch (error) {
      console.error("Error following address:", error);
    }
  };

  // Hook to read the followed addresses for a user in the contract
  const { data: followData } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getFollowedAddresses",
    args: [address],
  });

  const [mutableFollowData, setMutableFollowData] = useState<string[]>([]);

  useEffect(() => {
    if (followData) {
      const convertedData = Array.from(followData);
      setMutableFollowData(convertedData);
    }
  }, [followData]);

  // Fetching CIDs for followed addresses
  const [cidContents, setCidContents] = useState<CidContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followedAddresses, setFollowedAddresses] = useState<string[]>([]);

  // Fetching CIDs for followed addresses

  interface CidMappedEvent {
    user: string;
    index: number; // Changed from bigint to number
    cid: string;
  }

  // State to store the CidMapped events of followed users
  const [followedUsersCidMappedEvents, setFollowedUsersCidMappedEvents] = useState<CidMappedEvent[]>([]);

  // Fetch CidMapped events (for all users)
  const {
    data: allCidMappedEvents,
    isLoading: isLoadingCidMappedEvents,
    error: errorReadingCidMappedEvents,
  } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "CidMapped",
    fromBlock: process.env.NEXT_PUBLIC_DEPLOY_BLOCK ? BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK) : 0n,
    filters: {},
    blockData: true,
  });

  // Use useEffect to filter CidMapped events for followed users
  useEffect(() => {
    if (allCidMappedEvents) {
      allCidMappedEvents.forEach(event => console.log("Event Args: ", event.args));
    }
    if (allCidMappedEvents && mutableFollowData) {
      const eventsForFollowedUsers = allCidMappedEvents
        .filter(event => event.args.user && mutableFollowData.includes(event.args.user))
        .map(event => ({
          user: event.args.user as string,
          index: Number(event.args.index), // Consider changing this based on actual type
          cid: event.args.cid as string,
        }));

      console.log("Filtered Events For Followed Users: ", eventsForFollowedUsers);
      setFollowedUsersCidMappedEvents(eventsForFollowedUsers);
    }
  }, [allCidMappedEvents, mutableFollowData]);

  // Listening for new Events
  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CidMapped",
    listener: async (logs) => {
      logs.forEach(async (log) => {
        const { user, cid } = log.args;
  
        // Check if the user is one of the followed users
        if (mutableFollowData.includes(user ?? '')) {
          try {
            // Fetch content for the new CID
            const url = `https://${cid}.ipfs.nftstorage.link/blob`;
            const response = await fetch(url);
  
            if (response.ok) {
              const data = await response.json();
  
              // Update state with the new CID content
              setCidContents(prevContents => [
                ...prevContents,
                { cid: cid || '', content: data },
              ]);
            }
          } catch (error) {
            console.error("Error fetching new CID content:", error);
          }
        }
      });
    },
  });

  // Setting up to fetch CID contents for followed addresses
  interface CidContent {
    cid: string;
    content: {
      text: string;
      timestamp?: string;
    };
  }

  const { data: cidCountDataFollowed } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDsCount",
    args: [searchAddress || undefined],
  });

  const { data: cidsDataFollowed } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDs",
    args: [searchAddress || undefined, cidCountDataFollowed],
  });

  useEffect(() => {
    if (followData) {
      setFollowedAddresses(Array.from(followData));
    }
  }, [followData]);

  // Fetching and displaying CID contents for followed addresses
  useEffect(() => {
    const fetchCidContentsForFollowedAddresses = async () => {
      if (followedUsersCidMappedEvents.length > 0) {
        const contents = await Promise.all(
          followedUsersCidMappedEvents.map(async event => {
            try {
              // Using NFT.Storage gateway
              const url = `https://${event.cid}.ipfs.nftstorage.link/blob`;
              const response = await fetch(url);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              return { cid: event.cid, content: data };
            } catch (error) {
              console.error(error);
              return null;
            }
          }),
        );

        setCidContents(contents.filter((item): item is CidContent => item !== undefined));
        setIsLoading(false);
      }
    };
    fetchCidContentsForFollowedAddresses();
  }, [followedUsersCidMappedEvents]);

  return (
    <>
      <MetaHeader />

      {/* Search*/}
      <div
        className="min-h-screen bg-base-200 bg-no-repeat bg-center"
        style={{ backgroundImage: "url('/assets/clean-logo.png')", backgroundSize: "500px 500px" }}
      >
        <div className="flex items-center flex-col pt-6">
          <div className="flex items-center justify-center gap-8 w-full">
            <input
              type="text"
              placeholder="SEARCH NETWORK FOR ADDRESS"
              className="input font-bai-jamjuree w-full rounded-2xl px-5 bg-secondary border border-primary text-lg sm:text-2xl placeholder-grey uppercase"
              style={{ width: "50%" }}
              value={searchAddress}
              onChange={e => setSearchAddress(e.target.value)}
            />

            {/* Conditional rendering based on searchAddress and addressFound */}
            {searchAddress &&
              (addressFound ? (
                <button
                  className="btn btn-primary rounded-2xl capitalize font-normal text-white text-lg w-24 flex items-center gap-1 hover:gap-2 transition-all"
                  onClick={() => handleFollow(searchAddress)}
                >
                  Follow
                </button>
              ) : (
                <p className="border-4 border-primary rounded-2xl p-2 bg-base-200">
                  ADDRESS UNRECOGNIZED IN FOS NETWORK - PLEASE VERIFY AND RETRY
                </p>
              ))}
          </div>
        </div>

        {/* Posts */}

        <div className="flex items-center w-full py-6 justify-center">
          <div
            className="flex items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full"
            style={{ maxWidth: "95%" }}
          >
            {/* Make Sticky and add scroll */}
            <div
              className="flex flex-col items-center justify-center bg-white bg-opacity-70 rounded-3xl px-3 py-4 w-full"
              style={{ maxWidth: "99%" }}
            >
              {/* Single Entries */}
              <div
                className="bg-base-300 text-left text-lg rounded-3xl w-full px-10 py-5 my-3"
                style={{ maxWidth: "99%" }}
              >
                {/* Your existing code */}
                <div>
                  {/* List of followed addresses */}
                  <h3>Followed Addresses:</h3>
                  {followData && followData.map((follow, index) => <p key={index}>{follow}</p>)}
                </div>
                <div>
                  {/* CID's for followed addresses */}
                  <h3>CID's for Followed Addresses:</h3>
                  {cidContents &&
                    cidContents.map((cidContent, index) => (
                      <div key={index}>
                        <p>
                          <strong>IPFS CID:</strong> {cidContent.cid} -<strong> Timestamp:</strong>{" "}
                          {cidContent.content.timestamp
                            ? new Date(cidContent.content.timestamp).toLocaleString()
                            : "Unavailable"}
                        </p>
                        <p>
                          <strong>Content:</strong> {cidContent.content.text}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
