'use client';
import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useIntl } from 'react-intl';

import photoIcon from '@/../public/images/photo-icon.png';

const FileUploader = ({ onFilesSelected }) => {
    const intl = useIntl();
    const onDrop = useCallback(
        (acceptedFiles) => {
            // console.log(acceptedFiles) // files you dropped
            if (onFilesSelected) {
                onFilesSelected(acceptedFiles);
            }
        },
        [onFilesSelected],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
        },
    });

    return (
        <div {...getRootProps()} className="upload-box">
            <input {...getInputProps()} />
            <Image src={photoIcon} alt="" />
            {isDragActive ? (
                <p>{intl.formatMessage({ id: 'forms.dropFiles' })}</p>
            ) : (
                <p>{intl.formatMessage({ id: 'forms.dragDrop' })}</p>
            )}
        </div>
    );
};

export default FileUploader;
