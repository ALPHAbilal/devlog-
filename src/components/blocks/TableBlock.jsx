import { useState, useRef, useEffect, memo } from 'react';
import { Plus, X, AlignLeft, AlignCenter, AlignRight, Download, Copy, Check, Table } from 'lucide-react';

const TableBlock = memo(function TableBlock({ block, onUpdate, isFocused, onFocus }) {
  // Custom CSS for smooth scrolling
  const customStyles = `
    .table-scroll::-webkit-scrollbar {
      height: 6px;
    }
    .table-scroll::-webkit-scrollbar-track {
      background: rgba(30, 58, 95, 0.2);
      border-radius: 3px;
    }
    .table-scroll::-webkit-scrollbar-thumb {
      background: rgba(30, 58, 95, 0.5);
      border-radius: 3px;
    }
    .table-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(30, 58, 95, 0.7);
    }
  `;
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

  // Log initialization data (commented out for performance)
  // console.log('🟦 TableBlock: Initializing with block data:', {
  //   blockId: block.id,
  //   blockType: block.type,
  //   hasBlockData: !!block.data,
  //   blockData: block.data,
  //   willUseDefault: !block.data,
  //   defaultData: defaultData
  // });

  const [tableData, setTableData] = useState(() => {
    // Validate and ensure table data structure
    const data = block.data || defaultData;
    if (data && typeof data === 'object') {
      // Ensure all required fields exist
      if (!Array.isArray(data.headers)) {
        console.warn('🟦 TableBlock: Invalid headers, using default');
        data.headers = defaultData.headers;
      }
      if (!Array.isArray(data.rows)) {
        console.warn('🟦 TableBlock: Invalid rows, using default');
        data.rows = defaultData.rows;
      }
      if (!Array.isArray(data.columnAlignments)) {
        console.warn('🟦 TableBlock: Invalid columnAlignments, using default');
        data.columnAlignments = defaultData.columnAlignments;
      }
      if (typeof data.hasHeaderRow !== 'boolean') {
        data.hasHeaderRow = defaultData.hasHeaderRow;
      }
      
      // Fix column count mismatch on initialization
      const columnCount = data.headers.length;
      data.rows = data.rows.map(row => {
        if (row.length > columnCount) {
          // Trim excess columns
          return row.slice(0, columnCount);
        } else if (row.length < columnCount) {
          // Add empty columns
          return [...row, ...Array(columnCount - row.length).fill('')];
        }
        return row;
      });
      
      // Ensure columnAlignments matches header count
      if (data.columnAlignments.length !== columnCount) {
        if (data.columnAlignments.length > columnCount) {
          data.columnAlignments = data.columnAlignments.slice(0, columnCount);
        } else {
          data.columnAlignments = [...data.columnAlignments, ...Array(columnCount - data.columnAlignments.length).fill('left')];
        }
      }
    }
    return data;
  });
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);
  const tableRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Monitor block.data changes (commented out for performance)
  // useEffect(() => {
  //   console.log('🟦 TableBlock: block.data changed:', {
  //     blockId: block.id,
  //     newBlockData: block.data,
  //     currentTableData: tableData
  //   });
  // }, [block.data]);

  // Removed extractAllTags - now inlined in saveTable to avoid dependency issues

  // Removed sync with external changes - causes unnecessary re-renders

  // Mark as initialized after mount and cleanup on unmount
  useEffect(() => {
    // Set initialized after a longer delay to prevent initial saves
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 2000); // 2 second delay to ensure all blocks are loaded
    
    return () => {
      clearTimeout(timer);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Save table data with simple debouncing
  const saveTable = (newData) => {
    // Ensure data consistency before saving
    const columnCount = newData.headers.length;
    
    // Fix row lengths to match header count
    newData.rows = newData.rows.map(row => {
      if (row.length > columnCount) {
        // Trim excess columns
        return row.slice(0, columnCount);
      } else if (row.length < columnCount) {
        // Add empty columns
        return [...row, ...Array(columnCount - row.length).fill('')];
      }
      return row;
    });
    
    // Fix column alignments to match header count
    if (newData.columnAlignments.length !== columnCount) {
      if (newData.columnAlignments.length > columnCount) {
        newData.columnAlignments = newData.columnAlignments.slice(0, columnCount);
      } else {
        newData.columnAlignments = [...newData.columnAlignments, ...Array(columnCount - newData.columnAlignments.length).fill('left')];
      }
    }
    
    setTableData(newData);
    
    // Don't save during initialization
    if (!isInitializedRef.current) return;
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce the parent update with longer delay
    saveTimeoutRef.current = setTimeout(() => {
      onUpdate(block.id, { data: newData });
    }, 2000); // 2 second debounce to prevent rapid saves
  };

  // Handle cell edit
  const startEditingCell = (type, rowIndex, colIndex) => {
    // Validate indices
    if (colIndex >= tableData.headers.length) return;
    if (type === 'cell' && rowIndex >= tableData.rows.length) return;
    
    const key = `${type}-${rowIndex}-${colIndex}`;
    setEditingCell(key);
    
    if (type === 'header') {
      setCellValue(tableData.headers[colIndex] || '');
    } else {
      // Handle case where row might have fewer columns than headers
      const row = tableData.rows[rowIndex] || [];
      setCellValue(row[colIndex] || '');
    }
    
    if (onFocus) onFocus(block.id);
  };

  const saveCell = () => {
    if (!editingCell) return;
    
    const [type, rowIndex, colIndex] = editingCell.split('-');
    const newData = { ...tableData };
    const rowIdx = parseInt(rowIndex);
    const colIdx = parseInt(colIndex);
    
    if (type === 'header') {
      if (colIdx < newData.headers.length) {
        newData.headers[colIdx] = cellValue;
      }
    } else {
      if (rowIdx < newData.rows.length) {
        // Ensure the row has enough columns before setting value
        while (newData.rows[rowIdx].length <= colIdx) {
          newData.rows[rowIdx].push('');
        }
        newData.rows[rowIdx][colIdx] = cellValue;
      }
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
    
    // Generate unique column name
    const existingNumbers = newData.headers
      .filter(h => h.match(/^Column \d+$/))
      .map(h => parseInt(h.replace('Column ', '')))
      .filter(n => !isNaN(n));
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : newData.headers.length + 1;
    
    newData.headers.splice(colIndex, 0, `Column ${nextNumber}`);
    
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
    
    // Remove cell from each row (handle rows with different lengths)
    newData.rows = newData.rows.map(row => {
      if (index < row.length) {
        const newRow = [...row];
        newRow.splice(index, 1);
        return newRow;
      }
      return row;
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
    
    // Rows - ensure each row has the correct number of columns
    tableData.rows.forEach(row => {
      const fullRow = [...row];
      // Pad to match header count
      while (fullRow.length < tableData.headers.length) {
        fullRow.push('');
      }
      // Trim if too long
      if (fullRow.length > tableData.headers.length) {
        fullRow.length = tableData.headers.length;
      }
      markdown += '| ' + fullRow.join(' | ') + ' |\n';
    });
    
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export as CSV
  const exportAsCSV = () => {
    let csv = '';
    const columnCount = tableData.headers.length;
    
    // Headers
    if (tableData.hasHeaderRow) {
      csv += tableData.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    }
    
    // Rows - ensure each row has the correct number of columns
    tableData.rows.forEach(row => {
      const fullRow = [...row];
      // Pad or trim to match header count
      while (fullRow.length < columnCount) {
        fullRow.push('');
      }
      if (fullRow.length > columnCount) {
        fullRow.length = columnCount;
      }
      csv += fullRow.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',') + '\n';
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

  // Drag and drop removed for performance

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
      {/* Table icon indicator */}
      <div className="absolute -left-8 top-0 text-text-secondary/30">
        <Table size={18} />
      </div>
      {/* Table Controls - Subtle and elegant */}
      <div className="absolute -top-8 right-0 flex items-center gap-1.5 opacity-60 hover:opacity-100">
        <button
          onClick={toggleHeaderRow}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
            tableData.hasHeaderRow 
              ? 'bg-accent-green/20 text-accent-green border border-accent-green/30' 
              : 'bg-dark-secondary/50 text-text-secondary border border-dark-secondary/50 hover:border-text-secondary/30'
          }`}
        >
          Header
        </button>
        <button
          onClick={copyAsMarkdown}
          className="p-1.5 rounded-md bg-dark-secondary/50 text-text-secondary hover:bg-dark-secondary/80 hover:text-text-primary transition-all"
          title="Copy as Markdown"
        >
          {copied ? <Check size={14} className="text-accent-green" /> : <Copy size={14} />}
        </button>
        <button
          onClick={exportAsCSV}
          className="p-1.5 rounded-md bg-dark-secondary/50 text-text-secondary hover:bg-dark-secondary/80 hover:text-text-primary transition-all"
          title="Export as CSV"
        >
          <Download size={14} />
        </button>
      </div>

      {/* Table - Modern design with subtle borders */}
      <div className="bg-dark-primary/50 backdrop-blur-sm rounded-lg overflow-hidden border border-dark-secondary/30 shadow-lg shadow-dark-primary/20">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
        <div className="overflow-x-auto table-scroll">
          <table className="w-full border-collapse table-auto">
            {/* Column alignment controls - Hidden by default */}
            <thead className="opacity-0 hover:opacity-100 transition-opacity duration-200">
              <tr className="border-b border-dark-secondary/20">
                <th className="w-10"></th>
                {tableData.headers.map((_, index) => (
                  <th key={index} className="relative p-0">
                    <div className="absolute top-0 right-0 flex items-center gap-0.5 p-1 z-10 bg-dark-primary/90 backdrop-blur-sm rounded">
                      {Object.entries(alignmentIcons).map(([align, Icon]) => (
                        <button
                          key={align}
                          onClick={() => setColumnAlignment(index, align)}
                          className={`p-1 rounded transition-all ${
                            tableData.columnAlignments[index] === align
                              ? 'bg-accent-green/20 text-accent-green'
                              : 'hover:bg-dark-secondary/50 text-text-secondary/60 hover:text-text-secondary'
                          }`}
                          title={`Align ${align}`}
                        >
                          <Icon size={14} />
                        </button>
                      ))}
                      <button
                        onClick={() => removeColumn(index)}
                        className="p-1 hover:bg-red-500/20 rounded text-text-secondary/60 hover:text-red-400 ml-0.5 transition-all"
                        title="Delete column"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-10">
                  <button
                    onClick={() => addColumn()}
                    className="p-1 hover:bg-dark-secondary/50 rounded text-text-secondary/60 hover:text-accent-green transition-all"
                    title="Add column"
                  >
                    <Plus size={14} />
                  </button>
                </th>
              </tr>
            </thead>

            {/* Header row - Elegant design */}
            {tableData.hasHeaderRow && (
              <thead>
                <tr className="bg-gradient-to-r from-dark-secondary/20 to-dark-secondary/10 border-b border-dark-secondary/30">
                  <td className="w-10"></td>
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
                          className="w-full bg-dark-primary/80 backdrop-blur-sm text-text-primary px-3 py-2 
                                     focus:outline-none focus:ring-1 focus:ring-accent-green/50 font-medium
                                     border border-accent-green/30 rounded"
                        />
                      ) : (
                        <div
                          onClick={() => startEditingCell('header', 0, colIndex)}
                          className="px-3 py-2 cursor-text bg-transparent hover:bg-dark-secondary/20
                                     font-medium text-text-primary/90 transition-colors"
                        >
                          {header || <span className="text-text-secondary/60 italic">Header</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="w-10"></td>
                </tr>
              </thead>
            )}

            {/* Body rows */}
            <tbody>
              {tableData.rows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="border-b border-dark-secondary/20 hover:bg-dark-secondary/10 transition-colors"
                >
                  {/* Row controls - Minimalist design */}
                  <td className="w-10 relative group/row">
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className="p-1 hover:bg-red-500/20 rounded text-text-secondary/40 hover:text-red-400 transition-all"
                        title="Delete row"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </td>

                  {/* Cells - Ensure we render exactly as many cells as headers */}
                  {tableData.headers.map((_, colIndex) => {
                    const cell = row[colIndex] || '';
                    return (
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
                            className="w-full bg-dark-primary/60 backdrop-blur-sm text-text-primary px-3 py-2 
                                       focus:outline-none focus:ring-1 focus:ring-accent-green/40
                                       border border-accent-green/20 rounded transition-all"
                          />
                        ) : (
                          <div
                            onClick={() => startEditingCell('cell', rowIndex, colIndex)}
                            className="px-3 py-2 cursor-text bg-transparent hover:bg-dark-secondary/10
                                       text-text-primary/80 min-h-[40px] transition-colors
                                       flex items-center"
                          >
                            {cell ? (
                              // Render with basic markdown support
                              <span className="whitespace-pre-wrap">
                                {cell.split(/(`[^`]+`)/g).map((part, i) => 
                                  part.startsWith('`') && part.endsWith('`') ? (
                                    <code key={i} className="px-1 py-0.5 bg-dark-secondary/50 text-accent-green/80 text-sm rounded">
                                      {part.slice(1, -1)}
                                    </code>
                                  ) : (
                                    <span key={i}>{part}</span>
                                  )
                                )}
                              </span>
                            ) : (
                              <span className="text-text-secondary/40 text-sm italic">Empty</span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Row end spacer */}
                  <td className="w-10"></td>
                </tr>
              ))}

              {/* Add row button - Subtle design */}
              <tr className="hover:bg-dark-secondary/5 transition-colors">
                <td colSpan={tableData.headers.length + 2} className="text-center py-2">
                  <button
                    onClick={() => addRow()}
                    className="px-4 py-1.5 bg-dark-secondary/30 hover:bg-dark-secondary/50 
                               rounded-md text-text-secondary/70 hover:text-text-primary
                               text-sm flex items-center gap-1.5 mx-auto transition-all
                               border border-dark-secondary/30 hover:border-dark-secondary/50"
                  >
                    <Plus size={12} />
                    <span className="font-medium">Add Row</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions - Elegant helper text */}
      {tableData.rows.every(row => row.every(cell => !cell)) && (
        <div className="text-center text-text-secondary/50 text-xs mt-3 font-light">
          <span className="inline-flex items-center gap-3">
            <span>Click to edit</span>
            <span className="text-text-secondary/30">•</span>
            <span>Tab to navigate</span>
            <span className="text-text-secondary/30">•</span>
            <span>Enter for new row</span>
          </span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Fast shallow comparison
  if (prevProps.block.id !== nextProps.block.id) return false;
  if (prevProps.isFocused !== nextProps.isFocused) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;
  if (prevProps.onFocus !== nextProps.onFocus) return false;
  
  // Quick data reference check
  const prevData = prevProps.block.data;
  const nextData = nextProps.block.data;
  
  // If same reference, no need to re-render
  if (prevData === nextData) return true;
  
  // If one is null/undefined, re-render
  if (!prevData || !nextData) return false;
  
  // Quick structure check without deep comparison
  return (
    prevData.hasHeaderRow === nextData.hasHeaderRow &&
    prevData.headers?.length === nextData.headers?.length &&
    prevData.rows?.length === nextData.rows?.length
  );
});

export default TableBlock;