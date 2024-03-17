import React, { useState } from "react";

interface Props {
  onFileChange: (file: File) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmAvatarPopUp: React.FC<Props> = ({
  onFileChange,
  onConfirm,
  onCancel,
}) => {
  const [preview, setPreview] = useState("");

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onFileChange(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="flex flex-col items-center p-4 bg-discord-light-grey rounded shadow-lg">
        <input type="file" onChange={handleFileSelected} />
        {preview && (
          <img
            src={preview}
            alt="Avatar Preview"
            className="mt-4 max-w-[700px] max-h-[700px] object-cover "
          />
        )}
        <div className="flex justify-around w-full mt-4">
          <button
            onClick={onConfirm}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
