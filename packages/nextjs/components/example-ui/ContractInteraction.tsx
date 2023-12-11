import { useState } from "react";
import { parseEther } from "viem";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
const nftStorageApiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;

export const ContractInteraction = () => {
  const [visible, setVisible] = useState(true);
  const [newText, saveNewText] = useState("");

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "setGreeting",
    args: [newText],
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      saveNewText("");
    },
  });

  const saveAsJsonFileAndSendToNFTStorage = async () => {
    const jsonData = { text: newText };
    const jsonContent = JSON.stringify(jsonData, null, 2);
    
    try {
      const formData = new FormData();
      formData.append('file', new Blob([jsonContent], { type: "application/json" }));
  
      const response = await fetch('https://api.nft.storage/upload', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nftStorageApiKey}`
        },
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        const cid = data.value.cid; // Extracting CID from the response
        console.log(`Uploaded to NFT.Storage - CID: ${cid}`);
  
        // Use the CID as needed in your application
      } else {
        console.error("Failed to upload to NFT.Storage");
        console.log("Status:", response.status);
      }
    } catch (error) {
      console.error("An error occurred while uploading to NFT.Storage", error);
    }
  
    // After sending the data, you can proceed to send it to the contract
    writeAsync();
  };
  



  return (
    <div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-10 px-10 mt-5 lg:py-auto w-full max-w-[98vw]">





          <div 
            className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-5 w-full"
            style={{ maxWidth: "95%" }}
          > 

          <span className="text-4xl sm:text-6xl text-base-300 mb-5">articulate your opinions and ideas</span>

          <textarea
            placeholder="WHATS ON YOUR MIND?"
            value={newText}
            style={{ 
              maxWidth: "95%", 
              maxHeight: "95%", 
              height: "40vh",
              resize: "none",
              padding: "12px",
            }} 
            className="input font-bai-jamjuree w-full border border-primary rounded-3xl text-lg sm:text-xl placeholder-grey"
            onChange={e => saveNewText(e.target.value)}
          />

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">


            <div className="flex rounded-full border border-primary p-1 flex-shrink-0">



                <button
                  className="btn btn-primary rounded-full capitalize font-normal font-white w-30 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
                  onClick={saveAsJsonFileAndSendToNFTStorage}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      Commit Your Msg
                    </>
                  )}
                </button>


            </div>
          </div>
          
        </div>

    </div>
  );
};



{/* Text bubble with close button

<div className={`mt-10 flex gap-2 ${visible ? "" : "invisible"} max-w-2xl`}>
<div className="flex gap-5 bg-base-200 bg-opacity-80 z-0 p-7 rounded-2xl shadow-lg">
<span className="text-3xl">👋🏻</span>
<span className="text-3xl">Hello</span>
</div>
<button
className="btn btn-circle btn-ghost h-6 w-6 bg-base-200 bg-opacity-80 z-0 min-h-0 drop-shadow-md"
onClick={() => setVisible(false)}
>
<XMarkIcon className="h-4 w-4" />
</button>
</div> 

*/}