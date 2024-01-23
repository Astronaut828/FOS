import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { create } from "zustand";
import { CurrencyDollarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MetaHeader } from "~~/components/MetaHeader";
import {
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
    args: [address],
  });

  const handleFollow = async (addressToFollow: string) => {
    try {
      await Promise.all([followAddressAsync({ args: [addressToFollow] })]);
      setSearchAddress("");

      setMutableFollowData(prevData => {
        if (!prevData.includes(addressToFollow)) {
          return [...prevData, addressToFollow];
        }
        return prevData;
      });
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
    refetchAllCidsInclNewFollowed();
  }, [followData]);

  // TO DO
  // Hook to tip a user
  const [tipUser, setPayable] = useState(true);

  // TO DO
  // Hook to unfollow
  const [unfollow, setUnfollow] = useState(true);

  // Fetching CIDs for followed addresses
  const [cidContents, setCidContents] = useState<CidContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // State to store the CidMapped events of followed users
  const [followedUsersCidMappedEvents, setFollowedUsersCidMappedEvents] = useState<CidMappedEvent[]>([]);
  interface CidMappedEvent {
    user: string;
    index: number;
    cid: string;
  }

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
    if (allCidMappedEvents && mutableFollowData) {
      const eventsForFollowedUsers = allCidMappedEvents
        .filter(event => event.args.user && mutableFollowData.includes(event.args.user))
        .map(event => ({
          user: event.args.user as string,
          index: Number(event.args.index),
          cid: event.args.cid as string,
        }));

      setFollowedUsersCidMappedEvents(eventsForFollowedUsers);
    }
  }, [allCidMappedEvents, mutableFollowData]);

  // Listening for new Events
  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CidMapped",
    listener: async logs => {
      logs.forEach(async log => {
        const { user, cid } = log.args;
        // Check if the user is one of the followed users
        if (mutableFollowData.includes(user ?? "")) {
          try {
            // Fetch content for the new CID
            const url = `https://${cid}.ipfs.nftstorage.link/blob`;
            const response = await fetch(url);

            if (response.ok) {
              const data = await response.json();

              // Update state with the new CID content
              setCidContents(prevContents => {
                const newContents = [...prevContents, { cid: cid || "", content: data }];
                return newContents;
              });
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

  // Fuction to refetch all CIDs for followed addresses
  const [newFollowRecorded, setNewFollowRecorded] = useState(false);
  const refetchAllCidsInclNewFollowed = async () => {
    setNewFollowRecorded(true);
  };

  // Fetching and displaying CID contents for followed addresses
  useEffect(() => {
    const fetchCidContentsForFollowedAddresses = async () => {
      if (followedUsersCidMappedEvents.length > 0 || newFollowRecorded) {
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
        setNewFollowRecorded(false);
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
        style={{
          backgroundImage: "url('/assets/clean-logo.png')",
          backgroundSize: "350px 350px",
          backgroundPosition: "center 105%"
        }}
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
            className="flex items-center justify-center bg-base-100 rounded-3xl px-1 py-2 w-full"
            style={{ maxWidth: "95%" }}
          >
            {/* TO DO: Make Sticky and add scroll */}
            {/* Single Entries */}
            <div
              className="bg-base-300 text-left text-lg rounded-3xl w-full px-4 py-1 my-1"
              style={{ maxWidth: "99%" }}
            >
              <div>
                <div>
                  {/* Conditional Rendering: Display Introductory Notice or CID's for followed addresses */}
                  {followedUsersCidMappedEvents.length === 0 && cidContents.length === 0 ? (
                    // Display Introductory Notice
                    <div
                      className="bg-base-300 text-left text-lg rounded-3xl w-full px-4 py-1 my-1"
                      style={{ maxWidth: "99%" }}
                    >
                      <div className="flex flex-col items-center justify-center bg-base-100 bg-opacity-70 rounded-3xl p-4 md:px-12 w-full">
                        <div className="w-full md:w-2/3">
                          <h2 className="text-2xl">Welcome to the FOS Network!</h2>
                          <p>Get started and engage with the community:</p>

                          <ul>
                            <li>
                              <strong>Follow Users:</strong> To follow a user, search for their address in the search bar.
                              If the address belongs to a registered user, you'll have the option to follow them. Posts
                              from users you follow will appear in your stream.
                            </li>
                            <br></br>
                            <li>
                              <strong>Post Content:</strong> Log in with your wallet to compose and share your content.
                              Your posts are uploaded to IPFS, and the returning CID (Content Identifier) is stored on the
                              blockchain under your address.
                            </li>
                          </ul>

                          <p>
                            Our platform leverages IPFS and blockchain technology, ensuring that your content is secure
                            and <strong>immutable</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Otherwise, Display Posts
                    cidContents &&
                    cidContents
                      .slice() // Create a shallow copy of the array
                      .sort((a, b) => {
                        // Sort by timestamp in descending order (newest first)
                        return (
                          (new Date(b.content.timestamp || "").getTime() || 0) -
                          (new Date(a.content.timestamp || "").getTime() || 0)
                        );
                      })
                      .map((cidContent, index) => {
                        // Find the corresponding user for this CID content
                        const postCreator = followedUsersCidMappedEvents.find(
                          event => event.cid === cidContent.cid,
                        )?.user;

                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center justify-center bg-base-100 bg-opacity-70 rounded-3xl p-4 md:px-8 w-full"
                            style={{ margin: "15px 0" }}
                          >
                            <div className="post-info grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 w-full  text-sm px-3 pb-2">
                              <div className="post-info-item flex items-center">
                                <strong className="mr-1">Posted by:</strong> {postCreator || "Unknown"}
                                <button
                                  className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0  ml-1"
                                  onClick={() => setPayable(false)}
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                                <button
                                  className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 drop-shadow-md ml-1"
                                  onClick={() => setUnfollow(false)}
                                >
                                  <CurrencyDollarIcon className="h-5 w-5" />
                                </button>
                              </div>
                              <div className="post-info-item flex items-center">
                                <strong className="mr-1">IPFS CID:</strong> {cidContent.cid}
                              </div>
                              <div className="post-info-item flex items-center">
                                <strong className="mr-1">Timestamp:</strong>{" "}
                                {cidContent.content.timestamp
                                  ? new Date(cidContent.content.timestamp).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Unavailable"}
                              </div>
                            </div>
                            <div
                              key={index}
                              className="flex flex-col items-center justify-center bg-base-100 bg-opacity-40 rounded-3xl p-4 md:px-8 w-full"
                              style={{ margin: "5px 0" }}
                            >
                              <div className="post-content text-base md:text-lg">
                                <p>{cidContent.content.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center">
          {/* List of followed addresses */}
          <h3>FOR TESTING // Followed Addresses:</h3>
          {followData && followData.map((follow, index) => <p key={index}>{follow}</p>)}
        </div>
      </div>
    </>
  );
};

export default Home;
