'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { TbX } from 'react-icons/tb';
import { useIntl } from 'react-intl';
import './ImageCropModal.scss';

const VIEW = 320;
const OUTPUT = 800;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getMinScale = (width, height) => Math.max(VIEW / width, VIEW / height);

const ImageCropModal = ({
    isOpen,
    file,
    onCancel,
    onConfirm,
    shape = 'circle',
    title,
    queueLabel = '',
}) => {
    const intl = useIntl();
    const modalTitle = title ?? intl.formatMessage({ id: 'forms.cropPhoto' });
    const viewportRef = useRef(null);
    const imageRef = useRef(null);
    const dragRef = useRef(null);
    const [imageSrc, setImageSrc] = useState('');
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [minScale, setMinScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!file) {
            setImageSrc('');
            return undefined;
        }
        setNaturalSize({ width: 0, height: 0 });
        setIsSaving(false);
        const nextSrc = URL.createObjectURL(file);
        setImageSrc(nextSrc);
        return () => URL.revokeObjectURL(nextSrc);
    }, [file]);

    const clampPosition = useCallback((x, y, nextScale, width, height) => {
        const scaledW = width * nextScale;
        const scaledH = height * nextScale;
        return {
            x: clamp(x, VIEW - scaledW, 0),
            y: clamp(y, VIEW - scaledH, 0),
        };
    }, []);

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight } = event.target;
        const nextMin = getMinScale(naturalWidth, naturalHeight);
        const nextScale = nextMin;
        const nextPos = clampPosition(
            (VIEW - naturalWidth * nextScale) / 2,
            (VIEW - naturalHeight * nextScale) / 2,
            nextScale,
            naturalWidth,
            naturalHeight,
        );
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
        setMinScale(nextMin);
        setScale(nextScale);
        setPosition(nextPos);
        setIsSaving(false);
    };

    const updateScale = (nextScale) => {
        const clampedScale = clamp(nextScale, minScale, minScale * 3);
        const centerX = VIEW / 2;
        const centerY = VIEW / 2;
        const imageX = (centerX - position.x) / scale;
        const imageY = (centerY - position.y) / scale;
        const nextPos = clampPosition(
            centerX - imageX * clampedScale,
            centerY - imageY * clampedScale,
            clampedScale,
            naturalSize.width,
            naturalSize.height,
        );
        setScale(clampedScale);
        setPosition(nextPos);
    };

    const handlePointerDown = (event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: position.x,
            originY: position.y,
        };
    };

    const handlePointerMove = (event) => {
        if (!dragRef.current) return;
        const nextPos = clampPosition(
            dragRef.current.originX + (event.clientX - dragRef.current.startX),
            dragRef.current.originY + (event.clientY - dragRef.current.startY),
            scale,
            naturalSize.width,
            naturalSize.height,
        );
        setPosition(nextPos);
    };

    const handlePointerUp = () => {
        dragRef.current = null;
    };

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport || !isOpen) return undefined;

        const onWheel = (event) => {
            event.preventDefault();
            const delta = event.deltaY < 0 ? 0.08 : -0.08;
            updateScale(scale * (1 + delta));
        };

        viewport.addEventListener('wheel', onWheel, { passive: false });
        return () => viewport.removeEventListener('wheel', onWheel);
    }, [isOpen, scale, minScale, naturalSize, position]);

    const handleConfirm = async () => {
        if (!imageRef.current || isSaving) return;
        setIsSaving(true);
        try {
            const sourceSize = VIEW / scale;
            const sourceX = -position.x / scale;
            const sourceY = -position.y / scale;
            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT;
            canvas.height = OUTPUT;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                imageRef.current,
                sourceX,
                sourceY,
                sourceSize,
                sourceSize,
                0,
                0,
                OUTPUT,
                OUTPUT,
            );

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (result) => {
                        if (result) resolve(result);
                        else reject(new Error('Could not crop image'));
                    },
                    'image/jpeg',
                    0.9,
                );
            });

            const baseName = (file?.name || 'photo').replace(/\.[^.]+$/, '');
            const cropped = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
            cropped.preview = URL.createObjectURL(blob);
            onConfirm(cropped);
        } catch (error) {
            console.error('Error cropping image:', error);
            setIsSaving(false);
        }
    };

    return (
        <Modal
            show={isOpen}
            onHide={onCancel}
            centered
            className="image-crop-modal"
            backdrop="static"
            keyboard={!isSaving}
        >
            <div className="image-crop-modal__content">
                <button
                    type="button"
                    className="image-crop-modal__close"
                    onClick={onCancel}
                    aria-label={intl.formatMessage({ id: 'forms.closeCrop' })}
                    disabled={isSaving}
                >
                    <TbX size={20} />
                </button>
                <h3>{modalTitle}</h3>
                {queueLabel ? <p className="image-crop-modal__queue">{queueLabel}</p> : null}
                <p>Drag to reposition, then crop to a 1:1 square.</p>

                <div
                    ref={viewportRef}
                    className={`image-crop-modal__viewport image-crop-modal__viewport--${shape}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                >
                    {imageSrc ? (
                        // Native img is required for canvas cropping of the loaded bitmap.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Crop preview"
                            draggable={false}
                            onLoad={handleImageLoad}
                            style={{
                                width: naturalSize.width ? naturalSize.width * scale : 'auto',
                                height: naturalSize.height ? naturalSize.height * scale : 'auto',
                                transform: `translate(${position.x}px, ${position.y}px)`,
                            }}
                        />
                    ) : null}
                    <div className="image-crop-modal__mask" />
                </div>

                <label className="image-crop-modal__zoom">
                    <span>Zoom</span>
                    <input
                        type="range"
                        min={minScale}
                        max={minScale * 3}
                        step={0.01}
                        value={scale}
                        onChange={(event) => updateScale(Number(event.target.value))}
                    />
                </label>

                <div className="image-crop-modal__actions">
                    <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleConfirm}
                        disabled={isSaving || !naturalSize.width}
                    >
                        {isSaving ? (
                            <>
                                <Spinner animation="border" size="sm" />{' '}
                                {intl.formatMessage({ id: 'forms.cropping' })}
                            </>
                        ) : (
                            intl.formatMessage({ id: 'forms.applyCrop' })
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ImageCropModal;
