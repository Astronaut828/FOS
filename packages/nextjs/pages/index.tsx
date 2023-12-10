import Link from "next/link";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />

{/* Search*/}
    <div 
      className="min-h-screen bg-base-200 bg-no-repeat bg-center" 
      style={{ backgroundImage: "url('/assets/clean-logo.png')", backgroundSize: '500px 500px' }}
    >

      <div className="flex items-center flex-col pt-6">

        <div 
          className="flex flex-col bg-base-100 text-center items-center rounded-2xl w-full mx-auto py-5" 
          style={{ maxWidth: "95%" }}
        >
          <div className="flex items-center justify-center gap-8 w-full">
            <input 
              type="text" 
              placeholder="Address" 
              className="input font-bai-jamjuree w-full rounded-2xl px-5 bg-secondary border border-primary text-lg sm:text-2xl placeholder-grey uppercase"
              style={{ width: '50%' }}
            />
            
            <button 
              className="btn btn-primary rounded-2xl capitalize font-normal text-white text-lg w-24 flex items-center gap-1 hover:gap-2 transition-all"
            >
              Search
            </button>

            <button 
              className="btn btn-primary rounded-2xl capitalize font-normal text-white text-lg w-24 flex items-center gap-1 hover:gap-2 transition-all"
            >
              Follow
            </button>
          </div>

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

                  <p> 
                    A pinning service is a service that accepts CIDs from a user in order to host the data associated with them.
                    The rationale behind defining a generic pinning service API is to have a baseline functionality and interface that can be provided by pinning services, so that tools can be built on top of a common base of functionality.
                    In this presentation, IPFS creator Juan Benet discusses current and potential pinning use cases, and how a standardized IPFS pinning API can meet these envisioned needs.
                    The API spec in this repo is the first step towards that future.
                  </p>

                </div>

                <div 
                  className="bg-base-300 text-left text-lg rounded-3xl w-full px-10 py-5 my-3"
                  style={{ maxWidth: "99%" }}
                > 

                  <p> List of posts from Adresses you follow </p>

                </div>


            </div>

          </div>
      </div>
    </div>
    </>
  );
};

export default Home;
