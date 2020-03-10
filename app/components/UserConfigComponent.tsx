import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spinner, Row, Col, Button, InputGroup, FormControl, Alert } from 'react-bootstrap';
import { loadFtpConfig, selectLibraryPath } from '../actions/playtestActions';
import { D1RootState, FtpConfig, LocalSettings } from '../reducers/types';

export default function UserConfigComponent() {
  const ftpConfig: FtpConfig = useSelector((state: D1RootState) => state.ftpConfig);

  const localSettings: LocalSettings = useSelector((state: D1RootState) => state.localSettings);

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    dispatch(loadFtpConfig());
  }, []);

  const browseClick = useCallback(() => {
    dispatch(selectLibraryPath());
  });

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
              <Button variant="outline-primary" onClick={browseClick}>
                Browse
              </Button>
            </InputGroup.Append>
          </InputGroup>
          <Alert variant="warning">Убедись что на диске свободно 5Гб, я пока не умею сам проверять.</Alert>
        </Col>
      </Row>
    );
  };
  return getInfo();
}
