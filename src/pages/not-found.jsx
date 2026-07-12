import { useEffect } from 'react';
import config from '@/utils/config';

const NotFound = () => {
    useEffect(() => {
        window.location.href = config.bot_redirect_url;
    }, []);

    return <></>;
};

export default NotFound;
