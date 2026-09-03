'use client';

import AddToFevouriteBtn from '@/components/formComponents/addToFevouriteBtn';
import Image from 'next/image';
import './PetSitterPopup.scss';

// load data

const PetSitterPopup = ({ onClose }) => {
    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <button className="close-button" onClick={onClose}>
                    &times;
                </button>
                <div className="profile-header">
                    <Image
                        src="/emma-j.jpg"
                        alt="Emily Watson"
                        width={100}
                        height={100}
                        className="profile-picture"
                    />
                    <h2>Emily Watson</h2>
                    <div className="rating">
                        <span>&#9733;&#9733;&#9733;&#9733;&#9733;</span> 4.9/5
                    </div>
                    <p>Location: Doetinchem, Netherlands (2.5 km)</p>
                    <div className="actions">
                        <button className="chat-button">Chat</button>
                        <AddToFevouriteBtn className="favorite-button" label="Favorite" />
                    </div>
                </div>
                <div className="profile-details">
                    <div>
                        <p>Active since</p>
                        <p>March 28, 2025</p>
                    </div>
                    <div>
                        <p>Last visit</p>
                        <p>4 months ago</p>
                    </div>
                    <div>
                        <p>Language</p>
                        <p>Dutch, English</p>
                    </div>
                    <div>
                        <p>Type of pets</p>
                        <p>Dog & Cat</p>
                    </div>
                </div>
                <div className="gallery">
                    <Image src="/amelia-w.jpg" alt="gallery image" width={150} height={150} />
                    <Image src="/ben-l.jpg" alt="gallery image" width={150} height={150} />
                    <Image src="/josh-r.jpg" alt="gallery image" width={150} height={150} />
                    <Image src="/louise-k.jpg" alt="gallery image" width={150} height={150} />
                </div>
                <div className="about-section">
                    <h3>About</h3>
                    <p>
                        Hi, I'm Martine from Doetinchem. I'm looking for someone to help me with
                        housework. We can certainly be flexible about the days and tasks we'll be
                        working with. The most important thing for me is a pleasant working
                        relationship and open communication. If you're interested, feel free to send
                        me a message. I'd love to hear from you!
                    </p>
                </div>
                <div className="actions">
                    <button className="chat-button">Chat</button>
                    <AddToFevouriteBtn className="favorite-button" label="Favorite" />
                </div>
            </div>
        </div>
    );
};

export default PetSitterPopup;
