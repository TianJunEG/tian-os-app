import React from 'react';
import PathwayNode from './PathwayNode';
import PathwayConnector from './PathwayConnector';

export default function PathwayListMobile({ nodes = [], onNodeOpen }) {
  return (
    <div className="md:hidden">
      <div className="relative pl-7">
        <PathwayConnector className="absolute bottom-4 left-2 top-4" />
        <div className="space-y-3">
          {nodes.map((node, idx) => (
            <div key={node.id || `${node.title}-${idx}`} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[22px] top-6 block h-3 w-3 rounded-full border-2 ${
                  node.status === 'completed'
                    ? 'border-success-500 bg-success-500'
                    : node.status === 'current'
                      ? 'border-gold-500 bg-gold-100'
                      : 'border-ink-100 bg-paper'
                }`}
              />
              <PathwayNode node={node} compact onOpen={onNodeOpen} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
