import { useState } from "react";
import { useAccount } from "wagmi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

const nftStorageApiKey = process.env.NEXT_PUBLIC_NFT_STORAGE_API_KEY;

export const ContractInteraction = () => {
  const [visible, setVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [newText, saveNewText] = useState("");
  const maxChars = 1500;

  const { address } = useAccount();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= maxChars) {
      saveNewText(e.target.value);
    }
  };

  const { writeAsync: writeCIDAsync } = useScaffoldContractWrite({
    contractName: "YourContract",
    functionName: "setUserCID",
    args: [undefined], // Provide an array with a single undefined element
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
      saveNewText("");
      console.log("CID set in contract:", txnReceipt.blockHash);
    },
  });

  // Function to save the text as a JSON file and upload it to NFT.Storage
  const saveAsJsonFileAndSendToNFTStorage = async () => {
    if (!newText.trim()) {
      console.log("No text provided");
      return;
    }

    setIsLoading(true);

    const timestamp = new Date().toISOString();
    const jsonData = {
      text: newText,
      timestamp: timestamp,
    };
    const jsonContent = JSON.stringify(jsonData, null, 2);

    try {
      const formData = new FormData();
      formData.append("file", new Blob([jsonContent], { type: "application/json" }));

      const response = await fetch("https://api.nft.storage/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${nftStorageApiKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const cid = data.value.cid;
        console.log(`Uploaded to NFT.Storage - CID: ${cid}`);

        // Call writeCIDAsync with the CID when it's available
        try {
          const txnReceipt = await writeCIDAsync({ args: [cid] });
          setIsLoading(false); // Reset isLoading once the operation is complete
        } catch (writeError) {
          console.error("Failed to write CID to the contract:", writeError);
          setIsLoading(false); // Reset isLoading in case of an error
        }
      } else {
        console.error("Failed to upload to NFT.Storage");
        console.log("Status:", response.status);
        console.log("Response:", await response.text());
        setIsLoading(false); // Reset isLoading in case of an error
      }
    } catch (uploadError) {
      console.error("An error occurred while uploading to NFT.Storage", uploadError);
      setIsLoading(false); // Reset isLoading in case of an error
    }
  };

  // Loading bar animation
  const LoadingBar = () => {
    return (
      <div className="w-44 p-0.5 flex items-center bg-neutral border border-primary rounded-full">
        <div className="h-1.5 border border-primary rounded-full bg-secondary animate-grow"></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-center items-center rounded-3xl bg-base-300 py-5 px-2 mt-5 lg:py-auto w-full max-w-[98vw]">
      <div
        className="flex flex-col items-center justify-center bg-base-100 rounded-3xl px-3 py-8 w-full"
        style={{ maxWidth: "95%" }}
      >
        {/* Warning Message */}
        <div className={`fixed top-50 left-0 right-0 z-50 ${visible ? "" : "invisible"} max-w-2xl mx-auto`}>
          <div className="flex justify-between items-center gap-5 bg-base-300 bg-opacity-80 rounded-2xl shadow-lg py-10 px-5">
            <div>
              <span className="text-3xl">
                🚨 Important: Data Immutability Notice<br></br>
              </span>
              <span className="text-2xl">
                <br></br>Your content is stored on IPFS and its identifier (CID) is recorded on the blockchain. This
                process is permanent: once uploaded, content cannot be altered or removed. Please upload responsibly.
              </span>
            </div>
            <button
              className="btn btn-circle btn-primary border-3 border-base-100 h-7 w-7 ml-4 bg-white bg-opacity-40 min-h-0 drop-shadow-md"
              onClick={() => setVisible(false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <textarea
          placeholder="Compose your message here..."
          value={newText}
          maxLength={maxChars}
          style={{
            maxWidth: "99%", // Adjusted to match the content area
            maxHeight: "95%",
            height: "40vh",
            resize: "none",
            padding: "12px", // Adjust padding if needed to match content area padding
          }}
          className="input font-bai-jamjuree w-full border border-primary rounded-3xl text-lg sm:text-xl placeholder-grey"
          onChange={handleTextChange}
        />
        <div className="mt-3">{maxChars - newText.length} characters remaining</div>
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-5">
          <div className="flex rounded-full border border-primary p-1 flex-shrink-0">
            <button
              className="btn btn-primary rounded-full capitalize font-normal font-white w-30 flex items-center gap-1 hover:gap-2 transition-all tracking-widest"
              onClick={saveAsJsonFileAndSendToNFTStorage}
              disabled={isLoading || !address}
            >
              {isLoading ? (
                // Display the Loading Bar when isLoading is true
                <LoadingBar />
              ) : // Display text based on address state
              address ? (
                "Commit Your Msg"
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
