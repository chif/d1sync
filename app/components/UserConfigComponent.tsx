import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import { loadFtpConfig } from '../actions/playtestActions';
import { D1RootState, FtpConfig } from '../reducers/types';

export default function UserConfigComponent() {
  const ftpConfig: FtpConfig = useSelector(
    (state: D1RootState) => state.ftpConfig
  );

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    dispatch(loadFtpConfig());
  }, []);

  const getInfo = () => {
    if (ftpConfig.bIsLoading) {
      return <Spinner animation="border" role="status" />;
    }
    return <p>{ftpConfig.path}</p>;
  };
  return (
    <>
      <h1>D1Playtester</h1>
      {getInfo()}
    </>
  );
}
