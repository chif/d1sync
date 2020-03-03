import React from 'react';
import PlaytestListComponent from './PlaytestListComponent';
import UserConfigComponent from './UserConfigComponent';

export default function Home() {
  return (
    <div>
      <UserConfigComponent />
      <PlaytestListComponent />
    </div>
  );
}
