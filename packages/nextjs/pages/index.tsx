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

        <div className="flex items-center w-full py-12 justify-center">
          <div 
            className="bg-base-100 text-center rounded-3xl px-10 py-10 w-full"
            style={{ maxWidth: "95%" }}
          > 
            <p>
              List of posts from Adresses you follow
            </p>
        </div>

      </div>
    </div>
    </>
  );
};

export default Home;
