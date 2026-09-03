import Image from 'next/image';
import Link from 'next/link';
import './style.scss';

const EditIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M10.5 25.5195L17.1195 25.497L31.5675 11.187C32.1345 10.62 32.4465 9.86701 32.4465 9.06601C32.4465 8.26501 32.1345 7.51201 31.5675 6.94501L29.1885 4.56601C28.0545 3.43201 26.076 3.43801 24.951 4.56151L10.5 18.8745V25.5195ZM27.0675 6.68701L29.451 9.06151L27.0555 11.4345L24.6765 9.05701L27.0675 6.68701ZM13.5 20.1255L22.545 11.166L24.924 13.545L15.8805 22.5015L13.5 22.509V20.1255Z"
            fill="#afaeac"
        />
        <path
            d="M7.5 31.5H28.5C30.1545 31.5 31.5 30.1545 31.5 28.5V15.498L28.5 18.498V28.5H12.237C12.198 28.5 12.1575 28.515 12.1185 28.515C12.069 28.515 12.0195 28.5015 11.9685 28.5H7.5V7.5H17.7705L20.7705 4.5H7.5C5.8455 4.5 4.5 5.8455 4.5 7.5V28.5C4.5 30.1545 5.8455 31.5 7.5 31.5Z"
            fill="#afaeac"
        />
    </svg>
);

const WorkerProfilePage = () => {
    return (
        <div className="owner-profile-container container">
            <h1 className="main-title">Profile</h1>

            <section className="profile-section solid-bg">
                <button className="edit-button">
                    <EditIcon />
                </button>
                <div className="card-content">
                    <Image
                        src="/images/sitter_thumb/sitter11.png"
                        alt="Emily Watson"
                        width={120}
                        height={120}
                        className="profile-picture"
                    />
                    <div className="personal-info">
                        <h2 className="profile-section__heading">Personal data</h2>
                        <p className="item">
                            Name : <span className="value">Emily Watson</span>
                        </p>
                        <p className="item">
                            Personal message :{' '}
                            <span className="value">Hi! I am Emily & I live in Amsterdam.</span>
                        </p>
                    </div>
                </div>
            </section>

            <section className="profile-section">
                <button className="edit-button">
                    <EditIcon />
                </button>
                <h2 className="profile-section__heading">My advertisement</h2>
                <div className="card-content advertisement-content">
                    <div className="ad-details">
                        <p className="item">
                            Address : <span className="value">Doetinchem, Netherlands</span>
                        </p>
                        <p className="item">
                            Rate from : <span className="value">€40.00/hour</span>
                        </p>
                        <p className="item">
                            Maximum distance : <span className="value">10 kilometers</span>
                        </p>
                    </div>
                    <div className="ad-details">
                        <p className="item">
                            Availability :{' '}
                            <span className="value">
                                Monday, Tuesday, Wednesday, Thrusday, Friday
                            </span>
                        </p>
                        <p className="item">
                            Languages : <span className="value">Dutch</span>
                        </p>
                    </div>
                </div>
            </section>

            <section className="profile-section">
                <div className="card-header">
                    <h2 className="profile-section__heading">Manage chat subscription(s)</h2>
                </div>
                <div className="card-content notification-setting">
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam5" defaultChecked />
                        <label htmlFor="amsterdam5">
                            <strong>Amsterdam, Netherlands (5/5)</strong>
                            <span>
                                Automatically renew the chat subscription for this location on
                                21/08/2025
                            </span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam4" defaultChecked />
                        <label htmlFor="amsterdam4">
                            <strong>Amsterdam, Netherlands (4/5)</strong>
                            <span>
                                Automatically renew the chat subscription for this location on
                                21/08/2025
                            </span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam0" />
                        <label htmlFor="amsterdam0">
                            <strong>Amsterdam, Netherlands (0/5)</strong>
                            <span>
                                Automatically renew the chat subscription for this location on
                                21/08/2025
                            </span>
                        </label>
                    </div>
                </div>
            </section>

            <section className="profile-section">
                <div className="card-header">
                    <h2 className="profile-section__heading">Notification settings</h2>
                </div>
                <div className="card-content notification-setting">
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam5" defaultChecked />
                        <label htmlFor="amsterdam5">
                            <strong>New users</strong>
                            <span>Get notitied when new users sign up that match your needs.</span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam4" defaultChecked />
                        <label htmlFor="amsterdam4">
                            <strong>Personal messages</strong>
                            <span>
                                Personal messages from other users and / or important messages from
                                the website itself.
                            </span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="amsterdam0" />
                        <label htmlFor="amsterdam0">
                            <strong>New users</strong>
                            <span>Get notiTled wnen new users Sign up tnat matcn your neeas.</span>
                        </label>
                    </div>
                </div>
            </section>

            <section className="profile-section solid-bg">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <Link href={'/'}>Hide My Call</Link>
                    <button className="btn text-danger">Delete Account</button>
                </div>
            </section>
        </div>
    );
};

export default WorkerProfilePage;
