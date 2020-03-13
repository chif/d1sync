import filesize from 'filesize';
import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spinner, Row, Col, Button, InputGroup, FormControl, Alert } from 'react-bootstrap';
import {
  loadFtpConfig,
  selectLibraryPath,
  updateLocalDriveInfo,
  autoSelectLibraryPath
} from '../actions/playtestActions';
import { D1RootState, FtpConfig, LocalSettings } from '../reducers/types';

export default function UserConfigComponent() {
  const ftpConfig: FtpConfig = useSelector((state: D1RootState) => state.ftpConfig);

  const localSettings: LocalSettings = useSelector((state: D1RootState) => state.localSettings);
  const driveInfo = useSelector((state: D1RootState) => state.localDriveInfo);

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    dispatch(loadFtpConfig());
  }, []);

  useEffect(() => {
    dispatch(updateLocalDriveInfo());
  }, [localSettings]);

  useEffect(() => {
    if (!localSettings.bPathWasSetByUser) {
      dispatch(autoSelectLibraryPath());
    }
  });

  const browseClick = useCallback(() => {
    dispatch(selectLibraryPath());
  });

  const getWarnings = () => {
    if (driveInfo.bPendingUpdate) {
      return <></>;
    }
    if (!localSettings.libraryPath) {
      return <Alert variant="danger">Настрой путь!</Alert>;
    }

    if (localSettings.libraryPath.length < 4) {
      return <Alert variant="danger">Нельзя использовать корень диска для библиотеки, засунть поглубже.</Alert>;
    }

    if (driveInfo.additionalSpaceNeeded > 0) {
      return (
        <Alert variant="danger">
          Освободи еще
          <span className="m-1">{filesize(driveInfo.spaceAvailable)}</span>
        </Alert>
      );
    }
    return <></>;
  };

  const getInfo = () => {
    if (ftpConfig.bIsLoading) {
      return <Spinner animation="border" role="status" />;
    }
    return (
      <Row>
        <Col>
          <InputGroup size="lg">
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon1">
                <FontAwesomeIcon className="mr-1" icon={faFolderOpen} />
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              aria-label="Large"
              aria-describedby="inputGroup-sizing-sm"
              value={localSettings.libraryPath}
              disabled
            />
            <InputGroup.Append>
              <InputGroup.Text>
                <small>{filesize(driveInfo.spaceAvailable)}</small>
              </InputGroup.Text>
              <Button variant="outline-primary" onClick={browseClick}>
                Browse
              </Button>
            </InputGroup.Append>
          </InputGroup>
          {getWarnings()}
        </Col>
      </Row>
    );
  };
  return getInfo();
}
