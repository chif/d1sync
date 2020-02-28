// @flow
import React from 'react';
import { Badge, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

type Props = {
  branchName: string;
  buildName: string;
  bIsImportant: boolean;
  playtestTitle: string;
  playtestDesc: string;
};

const BuildComponent: React.FC<Props> = props => {
  const getBadges = () => {
    const { bIsImportant } = props;

    if (bIsImportant) {
      return (
        <Badge pill variant="warning">
          !
        </Badge>
      );
    }

    return <span />;
  };

  const getButtons = () => {
    return (
      <div>
        <Button className="mr-3" variant="primary">
          Start
        </Button>
        <Button variant="secondary">
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      </div>
    );
  };

  const {
    branchName,
    buildName,
    bIsImportant,
    playtestTitle,
    playtestDesc
  } = props;

  const border: string = bIsImportant ? 'warning' : 'secondary';
  const branchBadge: string = branchName === 'Master' ? 'info' : 'light';

  return (
    <Card border={border} className="m-2">
      <Card.Header>
        <h5>
          <Badge variant={branchBadge}>{branchName}</Badge>
          <span className="m-1">{buildName}</span>
          {getBadges()}
        </h5>
      </Card.Header>
      <Card.Body>
        <Card.Title>{playtestTitle}</Card.Title>
        <Card.Text>{playtestDesc}</Card.Text>
        {getButtons()}
      </Card.Body>
    </Card>
  );
};

export default BuildComponent;
