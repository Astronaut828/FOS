import Link from "next/link";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { create } from "zustand";
import {
  useAnimationConfig,
  useScaffoldContract,
  useScaffoldContractRead,
  useScaffoldEventHistory,
  useScaffoldEventSubscriber,
  useScaffoldContractWrite
} from "~~/hooks/scaffold-eth";


const Home: NextPage = () => {

  // Importing the contract ABI 
  const { data: yourContract } = useScaffoldContract({ contractName: "YourContract" });
  const { address } = useAccount();

  // Searchbar functionality
  const [searchAddress, setSearchAddress] = useState('');
  const [addressFound, setAddressFound] = useState(false);

  // Hook to read CIDs count for a user in the contract
  const { data: cidCountData, refetch: refetchCidCount } = useScaffoldContractRead({
    contractName: "YourContract",
    functionName: "getUserCIDsCount",
    args: [searchAddress],
  });

  // Hook to add a new follow record to the contract
  const { writeAsync: followAddressAsync } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "followAddress",
    args: [undefined],
  });

  useEffect(() => {
    if (cidCountData !== undefined) {
      setAddressFound(cidCountData > 0);
    }
  }, [cidCountData]);
  
  const handleFollow = async (addressToFollow: string) => {
    try {
      await followAddressAsync({ args: [addressToFollow] });
      setSearchAddress(''); 
    } catch (error) {
      console.error("Error following address:", error);
    }
  };

  return (
    <>
      <MetaHeader />

{/* Search*/}
    <div 
      className="min-h-screen bg-base-200 bg-no-repeat bg-center" 
      style={{ backgroundImage: "url('/assets/clean-logo.png')", backgroundSize: '500px 500px' }}
    >

      <div className="flex items-center flex-col pt-6">

      <div className="flex items-center justify-center gap-8 w-full">
        <input 
          type="text" 
          placeholder="SEARCH NETWORK FOR ADDRESS" 
          className="input font-bai-jamjuree w-full rounded-2xl px-5 bg-secondary border border-primary text-lg sm:text-2xl placeholder-grey uppercase"
          style={{ width: '50%' }}
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
        />

        {/* Conditional rendering based on searchAddress and addressFound */}
        {searchAddress && (
            addressFound ? (
              <button 
              className="btn btn-primary rounded-2xl capitalize font-normal text-white text-lg w-24 flex items-center gap-1 hover:gap-2 transition-all"
              onClick={() => handleFollow(searchAddress)}
              >
                Follow
              </button>
            ) : (
              <p className="border-4 border-primary rounded-2xl p-2 bg-base-200">ADDRESS UNRECOGNIZED IN FOS NETWORK - PLEASE VERIFY AND RETRY</p>
            )
          )}
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
