import { useState, useRef, useEffect } from 'react';
import { Plus, X, GripVertical, AlignLeft, AlignCenter, AlignRight, Download, Copy, Check } from 'lucide-react';
import { parseMarkdown, extractTagsFromContent } from '../../utils/parseMarkdown.jsx';

export default function TableBlock({ block, onUpdate, isFocused, onFocus }) {
  // Initialize default table structure
  const defaultData = {
    headers: ['Column 1', 'Column 2', 'Column 3'],
    rows: [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ],
    columnAlignments: ['left', 'left', 'left'],
    hasHeaderRow: true
  };

  const [tableData, setTableData] = useState(block.data || defaultData);
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [hoveredCol, setHoveredCol] = useState(null);
  const [copied, setCopied] = useState(false);
  const [draggedRow, setDraggedRow] = useState(null);
  const inputRef = useRef(null);
  const tableRef = useRef(null);

  // Extract tags from all cells
  const extractAllTags = () => {
    const allTags = new Set();
    
    // Extract from headers
    if (tableData.hasHeaderRow) {
      tableData.headers.forEach(header => {
        const tags = extractTagsFromContent(header);
        tags.forEach(tag => allTags.add(tag));
      });
    }
    
    // Extract from rows
    tableData.rows.forEach(row => {
      row.forEach(cell => {
        const tags = extractTagsFromContent(cell);
        tags.forEach(tag => allTags.add(tag));
      });
    });
    
    return Array.from(allTags);
  };

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Save table data
  const saveTable = (newData) => {
    setTableData(newData);
    const tags = extractAllTags();
    onUpdate({ data: newData, tags });
  };

  // Handle cell edit
  const startEditingCell = (type, rowIndex, colIndex) => {
    const key = `${type}-${rowIndex}-${colIndex}`;
    setEditingCell(key);
    
    if (type === 'header') {
      setCellValue(tableData.headers[colIndex]);
    } else {
      setCellValue(tableData.rows[rowIndex][colIndex]);
    }
    
    if (onFocus) onFocus(block.id);
  };

  const saveCell = () => {
    if (!editingCell) return;
    
    const [type, rowIndex, colIndex] = editingCell.split('-');
    const newData = { ...tableData };
    
    if (type === 'header') {
      newData.headers[parseInt(colIndex)] = cellValue;
    } else {
      newData.rows[parseInt(rowIndex)][parseInt(colIndex)] = cellValue;
    }
    
    saveTable(newData);
    setEditingCell(null);
    setCellValue('');
  };

  // Add/Remove rows
  const addRow = (afterIndex = -1) => {
    const newData = { ...tableData };
    const newRow = new Array(tableData.headers.length).fill('');
    
    if (afterIndex === -1) {
      newData.rows.push(newRow);
    } else {
      newData.rows.splice(afterIndex + 1, 0, newRow);
    }
    
    saveTable(newData);
  };

  const removeRow = (index) => {
    if (tableData.rows.length <= 1) return; // Keep at least one row
    
    const newData = { ...tableData };
    newData.rows.splice(index, 1);
    saveTable(newData);
  };

  // Add/Remove columns
  const addColumn = (afterIndex = -1) => {
    const newData = { ...tableData };
    const colIndex = afterIndex === -1 ? tableData.headers.length : afterIndex + 1;
    
    // Add header
    newData.headers.splice(colIndex, 0, `Column ${newData.headers.length + 1}`);
    
    // Add column alignment
    newData.columnAlignments.splice(colIndex, 0, 'left');
    
    // Add empty cell to each row
    newData.rows = newData.rows.map(row => {
      const newRow = [...row];
      newRow.splice(colIndex, 0, '');
      return newRow;
    });
    
    saveTable(newData);
  };

  const removeColumn = (index) => {
    if (tableData.headers.length <= 1) return; // Keep at least one column
    
    const newData = { ...tableData };
    
    // Remove header
    newData.headers.splice(index, 1);
    
    // Remove alignment
    newData.columnAlignments.splice(index, 1);
    
    // Remove cell from each row
    newData.rows = newData.rows.map(row => {
      const newRow = [...row];
      newRow.splice(index, 1);
      return newRow;
    });
    
    saveTable(newData);
  };

  // Change column alignment
  const setColumnAlignment = (index, alignment) => {
    const newData = { ...tableData };
    newData.columnAlignments[index] = alignment;
    saveTable(newData);
  };

  // Toggle header row
  const toggleHeaderRow = () => {
    const newData = { ...tableData };
    newData.hasHeaderRow = !newData.hasHeaderRow;
    saveTable(newData);
  };

  // Copy table as markdown
  const copyAsMarkdown = () => {
    let markdown = '';
    
    // Headers
    if (tableData.hasHeaderRow) {
      markdown += '| ' + tableData.headers.join(' | ') + ' |\n';
      markdown += '| ' + tableData.columnAlignments.map(align => {
        if (align === 'left') return ':---';
        if (align === 'center') return ':---:';
        if (align === 'right') return '---:';
        return '---';
      }).join(' | ') + ' |\n';
    }
    
    // Rows
    tableData.rows.forEach(row => {
      markdown += '| ' + row.join(' | ') + ' |\n';
    });
    
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as CSV
  const exportAsCSV = () => {
    let csv = '';
    
    // Headers
    if (tableData.hasHeaderRow) {
      csv += tableData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    }
    
    // Rows
    tableData.rows.forEach(row => {
      csv += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Create download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Drag and drop rows
  const handleDragStart = (e, index) => {
    setDraggedRow(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedRow === null || draggedRow === dropIndex) return;
    
    const newData = { ...tableData };
    const [movedRow] = newData.rows.splice(draggedRow, 1);
    newData.rows.splice(dropIndex, 0, movedRow);
    
    saveTable(newData);
    setDraggedRow(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!editingCell) return;
    
    const [type, rowIndex, colIndex] = editingCell.split('-').map((v, i) => i > 0 ? parseInt(v) : v);
    
    if (e.key === 'Tab') {
      e.preventDefault();
      saveCell();
      
      // Navigate to next cell
      let nextCol = colIndex + (e.shiftKey ? -1 : 1);
      let nextRow = rowIndex;
      let nextType = type;
      
      if (!e.shiftKey && nextCol >= tableData.headers.length) {
        nextCol = 0;
        if (type === 'header' && tableData.rows.length > 0) {
          nextType = 'cell';
          nextRow = 0;
        } else if (type === 'cell' && nextRow < tableData.rows.length - 1) {
          nextRow++;
        }
      } else if (e.shiftKey && nextCol < 0) {
        nextCol = tableData.headers.length - 1;
        if (type === 'cell' && nextRow > 0) {
          nextRow--;
        } else if (type === 'cell' && nextRow === 0 && tableData.hasHeaderRow) {
          nextType = 'header';
        }
      }
      
      if (nextType === 'header' || (nextType === 'cell' && nextRow < tableData.rows.length)) {
        startEditingCell(nextType, nextRow, nextCol);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      saveCell();
      
      // Move to cell below
      if (type === 'header' && tableData.rows.length > 0) {
        startEditingCell('cell', 0, colIndex);
      } else if (type === 'cell') {
        if (rowIndex < tableData.rows.length - 1) {
          startEditingCell('cell', rowIndex + 1, colIndex);
        } else {
          // Add new row and edit it
          addRow(rowIndex);
          setTimeout(() => startEditingCell('cell', rowIndex + 1, colIndex), 0);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
      setCellValue('');
      if (onFocus) onFocus(null);
    }
  };

  const alignmentIcons = {
    left: AlignLeft,
    center: AlignCenter,
    right: AlignRight
  };

  const getAlignmentClass = (alignment) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className="group relative" ref={tableRef}>
      {/* Table Controls */}
      <div className="absolute -top-10 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={toggleHeaderRow}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            tableData.hasHeaderRow 
              ? 'bg-accent-green/20 text-accent-green' 
              : 'bg-dark-secondary text-text-secondary hover:text-text-primary'
          }`}
        >
          Header Row
        </button>
        <button
          onClick={copyAsMarkdown}
          className="p-1 hover:bg-dark-secondary rounded text-text-secondary hover:text-text-primary"
          title="Copy as Markdown"
        >
          {copied ? <Check size={16} className="text-accent-green" /> : <Copy size={16} />}
        </button>
        <button
          onClick={exportAsCSV}
          className="p-1 hover:bg-dark-secondary rounded text-text-secondary hover:text-text-primary"
          title="Export as CSV"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-primary rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Column alignment controls */}
            <thead>
              <tr className="border-b border-dark-secondary/50">
                <th className="w-8"></th>
                {tableData.headers.map((_, index) => (
                  <th key={index} className="relative p-0" onMouseEnter={() => setHoveredCol(index)}>
                    <div className={`absolute top-0 right-0 flex items-center gap-1 p-1 
                                    opacity-0 transition-opacity z-10 ${
                                      hoveredCol === index ? 'opacity-100' : ''
                                    }`}>
                      {Object.entries(alignmentIcons).map(([align, Icon]) => (
                        <button
                          key={align}
                          onClick={() => setColumnAlignment(index, align)}
                          className={`p-1 rounded transition-colors ${
                            tableData.columnAlignments[index] === align
                              ? 'bg-accent-green/20 text-accent-green'
                              : 'hover:bg-dark-secondary text-text-secondary'
                          }`}
                          title={`Align ${align}`}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                      <button
                        onClick={() => removeColumn(index)}
                        className="p-1 hover:bg-red-500/20 rounded text-text-secondary hover:text-red-500 ml-1"
                        title="Delete column"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-8">
                  <button
                    onClick={() => addColumn()}
                    className="p-1 hover:bg-dark-secondary rounded text-text-secondary hover:text-text-primary"
                    title="Add column"
                  >
                    <Plus size={16} />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Header row */}
            {tableData.hasHeaderRow && (
              <thead>
                <tr className="bg-dark-secondary/30 border-b border-dark-secondary/50">
                  <td className="w-8"></td>
                  {tableData.headers.map((header, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`relative ${getAlignmentClass(tableData.columnAlignments[colIndex])}`}
                    >
                      {editingCell === `header-0-${colIndex}` ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={saveCell}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-dark-secondary text-text-primary px-3 py-2 
                                     focus:outline-none focus:ring-1 focus:ring-accent-green font-medium"
                        />
                      ) : (
                        <div
                          onClick={() => startEditingCell('header', 0, colIndex)}
                          className="px-3 py-2 cursor-text hover:bg-dark-secondary/50 
                                     transition-colors font-medium text-text-primary"
                        >
                          {header || <span className="text-text-secondary">Header</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="w-8"></td>
                </tr>
              </thead>
            )}

            {/* Body rows */}
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="border-b border-dark-secondary/30 hover:bg-dark-secondary/20 transition-colors"
                  onMouseEnter={() => setHoveredRow(rowIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, rowIndex)}
                >
                  {/* Row controls */}
                  <td className="w-8 relative">
                    <div className={`flex items-center justify-center opacity-0 transition-opacity ${
                      hoveredRow === rowIndex ? 'opacity-100' : ''
                    }`}>
                      <button
                        draggable
                        onDragStart={(e) => handleDragStart(e, rowIndex)}
                        className="p-1 hover:bg-dark-secondary rounded cursor-move text-text-secondary"
                        title="Drag to reorder"
                      >
                        <GripVertical size={14} />
                      </button>
                    </div>
                  </td>

                  {/* Cells */}
                  {row.map((cell, colIndex) => (
                    <td 
                      key={colIndex}
                      className={`relative ${getAlignmentClass(tableData.columnAlignments[colIndex])}`}
                    >
                      {editingCell === `cell-${rowIndex}-${colIndex}` ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={saveCell}
                          onKeyDown={handleKeyDown}
                          className="w-full bg-dark-secondary text-text-primary px-3 py-2 
                                     focus:outline-none focus:ring-1 focus:ring-accent-green"
                        />
                      ) : (
                        <div
                          onClick={() => startEditingCell('cell', rowIndex, colIndex)}
                          className="px-3 py-2 cursor-text hover:bg-dark-secondary/50 
                                     transition-colors text-text-primary min-h-[40px]"
                        >
                          {cell ? (
                            <div className="space-y-1">
                              {parseMarkdown(cell)}
                            </div>
                          ) : (
                            <span className="text-text-secondary text-sm">Click to edit</span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}

                  {/* Row actions */}
                  <td className="w-8 relative">
                    <div className={`flex items-center justify-center opacity-0 transition-opacity ${
                      hoveredRow === rowIndex ? 'opacity-100' : ''
                    }`}>
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className="p-1 hover:bg-red-500/20 rounded text-text-secondary hover:text-red-500"
                        title="Delete row"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Add row button */}
              <tr>
                <td colSpan={tableData.headers.length + 2} className="text-center p-2">
                  <button
                    onClick={() => addRow()}
                    className="px-3 py-1 bg-dark-secondary hover:bg-dark-secondary/80 
                               rounded text-text-secondary hover:text-text-primary 
                               transition-colors text-sm flex items-center gap-1 mx-auto"
                  >
                    <Plus size={14} />
                    Add Row
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      {tableData.rows.every(row => row.every(cell => !cell)) && (
        <div className="text-center text-text-secondary text-sm mt-2">
          Click any cell to start editing • Tab to navigate • Enter for new row
        </div>
      )}
    </div>
  );
}