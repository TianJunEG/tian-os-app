import React from 'react';
import PathwayNode from './PathwayNode';
import PathwayConnector from './PathwayConnector';

export default function PathwayMapDesktop({ nodes = [], onNodeOpen }) {
  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {nodes.map((node, idx) => (
          <div key={node.id || `${node.title}-${idx}`} className="relative">
            {idx > 0 ? <PathwayConnector orientation="horizontal" className="absolute -left-2 top-1/2 w-2 xl:-left-3 xl:w-3" /> : null}
            <PathwayNode node={node} onOpen={onNodeOpen} />
          </div>
        ))}
      </div>
    </div>
  );
}
