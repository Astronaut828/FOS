import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { parseEther } from "viem";
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
    if (address === addressToFollow) {
      console.error("Cannot follow yourself.");
      return;
    }

    try {
      await Promise.all([followAddressAsync({ args: [addressToFollow] })]);
      setSearchAddress("");

      console.log("Before updating mutableFollowData:", mutableFollowData);
      setMutableFollowData(prevData => {
        const updatedData = prevData.includes(addressToFollow) ? prevData : [...prevData, addressToFollow];
        console.log("After updating mutableFollowData:", updatedData);
        return updatedData;
      });

      // Filter and update followedUsersCidMappedEvents for the new address
      if (allCidMappedEvents) {
        const newAddressEvents = allCidMappedEvents
          .filter(event => event.args.user === addressToFollow)
          .map(event => ({
            user: event.args.user as string,
            index: Number(event.args.index),
            cid: event.args.cid as string,
          }));

        setFollowedUsersCidMappedEvents(prevEvents => [...prevEvents, ...newAddressEvents]);
      }
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
    console.log("All CidMapped events received:", allCidMappedEvents);
    console.log("Current mutableFollowData:", mutableFollowData);

    if (allCidMappedEvents && mutableFollowData) {
      const eventsForFollowedUsers = allCidMappedEvents
        .filter(event => event.args.user && mutableFollowData.includes(event.args.user))
        .map(event => ({
          user: event.args.user as string,
          index: Number(event.args.index),
          cid: event.args.cid as string,
        }));

      console.log("Filtered events for followed users:", eventsForFollowedUsers);
      setFollowedUsersCidMappedEvents(eventsForFollowedUsers);
    }
  }, [allCidMappedEvents, mutableFollowData]);

  // Listening for new Events
  useScaffoldEventSubscriber({
    contractName: "YourContract",
    eventName: "CidMapped",
    listener: async logs => {
      console.log("New CidMapped event received:", logs);
      logs.forEach(async log => {
        const { user, cid } = log.args;
        if (!cid) return;

        // Check if the user is one of the followed users and if the CID is not already in the list
        if (mutableFollowData.includes(user ?? "") && !cidContents.some(content => content.cid === cid)) {
          try {
            // Fetch content for the new CID
            const url = `https://${cid}.ipfs.nftstorage.link/blob`;
            const response = await fetch(url);

            if (response.ok) {
              const data = await response.json();

              // Update state with the new CID content
              setCidContents(prevContents => {
                const newContents = prevContents.some(content => content.cid === cid)
                  ? prevContents
                  : [...prevContents, { cid, content: data }];
                console.log("Updated cidContents with new content:", newContents);
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

  // Setting up to fetch CID contents for followed addresses.
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

  // Fetching and displaying CID contents for followed addresses
  useEffect(() => {
    const fetchCidContentsForFollowedAddresses = async () => {
      console.log("Initiating fetch for CID contents");
      console.log("Current followedUsersCidMappedEvents:", followedUsersCidMappedEvents);

      if (followedUsersCidMappedEvents.length > 0) {
        const contents = await Promise.all(
          followedUsersCidMappedEvents.map(async event => {
            console.log(`Fetching content for CID: ${event.cid}`);
            try {
              const url = `https://${event.cid}.ipfs.nftstorage.link/blob`;
              const response = await fetch(url);

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data = await response.json();
              console.log(`Fetched content for CID ${event.cid}:`, data);
              return { cid: event.cid, content: data };
            } catch (error) {
              console.error(`Error fetching content for CID ${event.cid}:`, error);
              return null;
            }
          }),
        );

        console.log("Fetched contents for all followed CIDs:", contents);
        setCidContents(contents.filter((item): item is CidContent => item !== null));
        setIsLoading(false);
      }
    };

    fetchCidContentsForFollowedAddresses();
  }, [followedUsersCidMappedEvents]);

  // Unfollow functionality
  const [unfollow, setUnfollow] = useState(true);

  const { writeAsync: unfollowAddressAsync } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "unfollowAddress",
    args: [address],
  });

  const handleUnfollow = async (addressToUnfollow: string) => {
    try {
      await unfollowAddressAsync({ args: [addressToUnfollow] });
      console.log(`Unfollowed address: ${addressToUnfollow}`);
  
      setMutableFollowData(currentData => currentData.filter(addr => addr !== addressToUnfollow));
  
      setCidContents(currentContents => currentContents.filter(content => {
        const isContentFromUnfollowedUser = followedUsersCidMappedEvents.some(event => 
          event.user === addressToUnfollow && event.cid === content.cid
        );
        return !isContentFromUnfollowedUser;
      }));
  
    } catch (error) {
      console.error(`Error unfollowing address ${addressToUnfollow}:`, error);
    }
  };

  return (
    <>
      <MetaHeader />

      {/* Search*/}
      <div
        className="min-h-screen bg-base-200 bg-no-repeat bg-center"
        style={{
          backgroundImage: "url('/assets/clean-logo.png')",
          backgroundSize: "350px 350px",
          backgroundPosition: "center 90%",
        }}
      >
        <div className="flex items-center flex-col pt-6">
          <div className="flex items-center justify-center gap-8 w-full">
            <input
              type="text"
              placeholder="SEARCH NETWORK FOR ADDRESS"
              className="input font-bai-jamjuree w-full rounded-2xl px-5 bg-secondary border border-primary text-lg sm:text-xl placeholder-grey uppercase"
              style={{ width: "50%" }}
              value={searchAddress}
              onChange={e => setSearchAddress(e.target.value)}
            />

            {/* Conditional rendering based on searchAddress and addressFound */}
            {searchAddress && addressFound && (
              <button
                className="btn btn-primary rounded-2xl capitalize font-normal text-white text-lg w-24 border-green-600 border-2 flex items-center gap-1 hover:gap-2 transition-all"
                onClick={() => handleFollow(searchAddress)}
              >
                Follow
              </button>
            )}
          </div>
          {/* Conditional rendering for the warning message */}
          {searchAddress && !addressFound && (
            <p className="border-2 border-orange-600 text-orange-600 rounded-2xl p-2 bg-base-200 mt-2">
              ADDRESS UNRECOGNIZED IN FOS NETWORK - PLEASE VERIFY AND RETRY
            </p>
          )}
        </div>

        {/* Posts */}
        <div className="flex items-center w-full py-6 justify-center">
          <div
            className="flex items-center justify-center bg-base-100 rounded-3xl px-1 py-2 w-full"
            style={{ maxWidth: "95%" }}
          >
            {address ? (
              // Display posts for logged-in users
              <div
                className="bg-base-300 text-left text-lg rounded-3xl w-full px-4 py-1 my-1"
                style={{ maxWidth: "99%" }}
              >
                {followedUsersCidMappedEvents.length > 0 || cidContents.length > 0 ? (
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
                      console.log("Rendering post:", cidContent);
                      const postCreator: string | undefined = followedUsersCidMappedEvents.find(
                        event => event.cid === cidContent.cid,
                      )?.user;

                      return (
                        <div
                          key={cidContent.cid} // index
                          className="flex flex-col items-center justify-center bg-base-100 bg-opacity-70 rounded-3xl p-4 md:px-8 w-full"
                          style={{ margin: "15px 0" }}
                        >
                          <div className="post-info grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 w-full  text-sm px-3 pb-2">
                            <div className="post-info-item flex items-center">
                              <strong className="mr-1">Posted by:</strong> {postCreator || "Unknown"}
                              <button
                                className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 ml-1"
                                onClick={() => handleUnfollow(postCreator ?? "")}
                                title="Unfollow Address"
                              >
                                <TrashIcon className="h-5 w-5" />
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
                            <div className="post-content text-base md:text-lg" style={{ whiteSpace: "pre-wrap" }}>
                              <p>{cidContent.content.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  // No posts to display
                  <div>
                    <p>No posts to display. Start following users to see their posts here.</p>
                  </div>
                )}
              </div>
            ) : (
              // Display Introductory Notice for logged-out users
              <div
                className="bg-base-300 text-left text-lg rounded-3xl w-full px-4 py-4 my-1"
                style={{ maxWidth: "99%" }}
              >
                <div className="flex flex-col items-center justify-center bg-base-100 bg-opacity-70 rounded-3xl p-4 md:px-12 w-full">
                  <div className="w-full md:w-2/3">
                    <h2 className="text-2xl">Welcome to the FOS Network!</h2>
                    <p>Get started and engage with the community:</p>
                    <ul>
                      <li>
                        <strong>Follow Users:</strong> To follow a user, search for their address in the search bar. If
                        the address belongs to a registered user, you'll have the option to follow them. Posts from
                        users you follow will appear in your stream.
                      </li>
                      <br />
                      <li>
                        <strong>Post Content:</strong> Log in with your wallet to compose and share your content. Your
                        posts are uploaded to IPFS, and the returning CID (Content Identifier) is stored on the
                        blockchain under your address.
                      </li>
                    </ul>
                    <p>
                      Our platform leverages IPFS and blockchain technology, ensuring that your content is secure and{" "}
                      <strong>immutable</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
