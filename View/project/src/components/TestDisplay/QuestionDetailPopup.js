import React, { useState } from 'react';

const QuestionDetailPopup = ({
                                 question,
                                 passage, // This can be audio or passage
                                 isOpen,
                                 onClose,
                                 testName
                             }) => {
    const [showTranscript, setShowTranscript] = useState(false);

    if (!isOpen || !question) return null;

    console.log('=== POPUP RENDER DEBUG ===');
    console.log('Question:', question);
    console.log('Content:', passage);
    console.log('Content type:', passage?.contentType);
    console.log('Question context:', question.context);
    console.log('Question set instructions:', question.questionSetInstructions);

    const formatQuestionTypeSafe = (type) => {
        if (!type) {
            return '[Unknown] Unknown Question Type';
        }

        const typeMap = {
            // Reading types
            'FILL_IN_THE_BLANK': '[Reading] Diagram Label Completion',
            'MATCHING': '[Reading] Matching Headings',
            'MCQ': '[Reading] Multiple Choice',
            'SHORT_ANSWER': '[Reading] Short Answer',
            'TRUE_FALSE_NOT_GIVEN': '[Reading] True/False/Not Given',

            // Listening types
            'LISTENING_MCQ': '[Listening] Multiple Choice',
            'LISTENING_FILL_IN_THE_BLANK': '[Listening] Form/Note Completion',
            'LISTENING_SHORT_ANSWER': '[Listening] Short Answer',
            'LISTENING_MATCHING': '[Listening] Matching',
            'NOTE_COMPLETION': '[Listening] Note/Form Completion',
            'FORM_COMPLETION': '[Listening] Form Completion',
            'TABLE_COMPLETION': '[Listening] Table Completion'
        };

        const prefix = passage?.contentType === 'audio' ? '[Listening]' : '[Reading]';
        return typeMap[type] || `${prefix} ${type.replace(/_/g, ' ')}`;
    };

    const getStatusColor = (question) => {
        if (question.isSkipped) return '#6c757d';
        if (question.isCorrect) return '#28a745';
        return '#dc3545';
    };

    // ✅ Parse question context for listening format with full support
    const parseListeningContext = (context, questionText, questionSetInstructions) => {
        console.log('=== CONTEXT PARSING DEBUG ===');
        console.log('Context from DB:', context);
        console.log('Question Set Instructions:', questionSetInstructions);
        console.log('Question text:', questionText);
        console.log('Question object full:', JSON.stringify(question, null, 2));

        // ✅ Try to use real context from database first
        if (context && context !== '(Null)' && context.trim() !== '' && context !== 'undefined') {
            console.log('✅ Using REAL context from database');

            // Extract instructions from questionSetInstructions or context
            let instructions = questionSetInstructions || 'Complete the information below.';
            if (!instructions || instructions === '(Null)' || instructions.trim() === '') {
                // Try to extract from context
                const instructionMatch = context.match(/(Complete[^.]*\.|Choose[^.]*\.)/i);
                instructions = instructionMatch ? instructionMatch[1] : 'Complete the information below.';
            }

            return {
                type: 'real_context',
                instructions: instructions,
                fullContext: context,
                questionNumber: question.displayNumber || question.orderInTest || question.questionId,
                isFromFallback: false
            };
        }

        console.log('⚠️ Context is null/empty from backend - using fallback');

        // ✅ Fallback logic (existing)
        const qText = questionText || '';
        const questionNum = question.displayNumber || question.orderInTest || question.questionId;

        // Format 1: Form completion "Express train leaves at (1) ……………………"
        if (qText.includes('(1)') || qText.includes('……') || qText.includes('Express train')) {
            return {
                type: 'form_simple',
                instructions: 'Complete the form below.',
                questionText: qText,
                questionNumber: questionNum,
                isFromFallback: true
            };
        }

        // Format 2: Summary completion with long text
        return {
            type: 'summary',
            instructions: 'Complete the summary below.',
            completionText: `A wetland is an area where the soil is typically water-logged. Plants and animals living there depend on the wetness for their ___${questionNum}___. Draining swamps is a widespread occurrence which kills off wildlife and, consequently, wetlands are ___2___ worldwide. It is a feature of wetlands that conditions vary according to ___3___. Water-tolerant plants grow both in and out of the water and water levels are usually ___4___. Wetlands naturally occur between land and water and become ___5___ for various wildlife during very dry periods. They also act as nurseries for different kinds of animal life. Wetlands are known to upgrade ___6___ by removing pollutants.`,
            questionNumber: questionNum,
            isFromFallback: true
        };
    };

    // ✅ Render real context from database with proper table formatting
    const renderRealContextWithBlanks = (contextText) => {
        if (!contextText) return null;

        console.log('=== RAW CONTEXT FROM DB ===');
        console.log('Raw text:', JSON.stringify(contextText));
        console.log('Split by newlines:');
        contextText.split('\n').forEach((line, idx) => {
            console.log(`Line ${idx}: "${line}"`);
        });

        // Parse table format more accurately
        // NEW robust table parser
        const rawLines = contextText.split(/\r?\n/);
        const lines = rawLines
            .map(line => line.trim())
            .filter(line => line.length > 0);

// 1) Find the header row (we know it contains these columns)
        const headerRegex = /Transport\s*\|\s*Cash\s*Fare\s*\|\s*Card\s*Fare/i;
        const headerIndex = lines.findIndex(line => headerRegex.test(line));

        let headers = [];
        let tableData = [];

        if (headerIndex >= 0) {
            // 2) Split header into columns
            headers = lines[headerIndex].split(/\s*\|\s*/).map(h => h.trim());

            // 3) All subsequent pipe-lines (until a blank or non-pipe line) are data rows
            for (let i = headerIndex + 1; i < lines.length; i++) {
                const row = lines[i];

                // skip the dashed separator line (e.g. “---|---|---”)
                if (/^[\-\s\|]+$/.test(row)) continue;

                // stop if we hit a line without any pipes
                if (!row.includes('|')) break;

                // parse cells
                const cells = row
                    .split(/\s*\|\s*/)
                    .map(c => c.trim());

                // only push rows matching the header column count
                if (cells.length === headers.length) {
                    tableData.push(cells);
                }
            }
        }

// 4) Render it:
        return (
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    marginBottom: '15px',
                    color: '#1976d2',
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '8px'
                }}>
                    Table 1
                </div>

                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '2px solid #1976d2',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <thead>
                    <tr>
                        {headers.map((h, idx) => (
                            <th key={idx} style={{
                                backgroundColor: '#1976d2',
                                color: 'white',
                                padding: '12px 8px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                border: '1px solid #1976d2'
                            }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {tableData.map((row, r) => (
                        <tr key={r}>
                            {row.map((cell, c) => {
                                const blankMatch = cell.match(/___(\d+)___/);
                                if (blankMatch) {
                                    const num = blankMatch[1];
                                    const isCurrent = num == (question.displayNumber || question.orderInTest);
                                    const after = cell.replace(/___\d+___/, '').trim();

                                    return (
                                        <td key={c} style={{
                                            padding: '12px 8px',
                                            textAlign: 'left',
                                            backgroundColor: isCurrent ? '#fff3cd' : '#ffffff',
                                            border: isCurrent ? '2px solid #ffc107' : '1px solid #dee2e6',
                                            position: 'relative'
                                        }}>
                                            {isCurrent && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-8px',
                                                    right: '-8px',
                                                    backgroundColor: getStatusColor(question),
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    zIndex: 1
                                                }}>{num}</span>
                                            )}
                                            <span style={{
                                                display: 'inline-block',
                                                minWidth: '60px',
                                                padding: '6px 12px',
                                                backgroundColor: isCurrent ? '#ffffff' : '#e9f7ff',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px',
                                                fontWeight: isCurrent ? 'bold' : 'normal'
                                            }}>
                      {isCurrent ? (question.responseText || '(no answer)') : `___${num}___`}
                    </span>
                                            {after && <span style={{ marginLeft: '8px' }}>{after}</span>}
                                        </td>
                                    );
                                }

                                // normal cell
                                return (
                                    <td key={c} style={{
                                        padding: '12px 8px',
                                        textAlign: 'left',
                                        border: '1px solid #dee2e6',
                                        fontSize: '14px'
                                    }}>{cell}</td>
                                );
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );

    };

    // ✅ Render listening question with real context
    const renderListeningQuestionContent = () => {
        const parsedContext = parseListeningContext(
            question.context,
            question.questionText,
            question.questionSetInstructions
        );

        if (!parsedContext) {
            return (
                <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '12px',
                    marginBottom: '15px'
                }}>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                        {question.questionText || `Question ${question.displayNumber || question.orderInTest || question.questionId}`}
                    </p>
                </div>
            );
        }

        return (
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '15px'
            }}>
                {/* Instructions */}
                <div style={{
                    backgroundColor: parsedContext.isFromFallback ? '#fff3cd' : '#e3f2fd',
                    border: `1px solid ${parsedContext.isFromFallback ? '#ffeaa7' : '#bbdefb'}`,
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px'
                }}>
                    {parsedContext.isFromFallback && (
                        <div style={{
                            backgroundColor: '#f0ad4e',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            marginBottom: '10px',
                            display: 'inline-block'
                        }}>
                            ⚠️ Using sample data - Context not available from backend
                        </div>
                    )}
                    <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontStyle: 'italic'
                    }}>
                        {parsedContext.instructions}
                    </p>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                        Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.
                    </p>
                </div>

                {/* Question Content based on type */}
                {parsedContext.type === 'real_context' ? (
                    // ✅ REAL CONTEXT from database
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '20px',
                        fontSize: '14px'
                    }}>
                        <div style={{
                            whiteSpace: 'pre-line',
                            lineHeight: '1.6'
                        }}>
                            {renderRealContextWithBlanks(parsedContext.fullContext)}
                        </div>
                    </div>
                ) : parsedContext.type === 'form_simple' ? (
                    // Simple form format: "Express train leaves at (1) ……………………"
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '20px',
                        fontSize: '14px'
                    }}>
                        <h5 style={{
                            margin: '0 0 15px 0',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            fontStyle: 'italic',
                            color: '#495057'
                        }}>
                            Travel Information
                        </h5>

                        <div style={{
                            backgroundColor: '#fff',
                            border: '2px solid #ffc107',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                fontSize: '14px'
                            }}>
                                <span style={{
                                    backgroundColor: getStatusColor(question),
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {parsedContext.questionNumber}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {parsedContext.questionText.split(/(\(\d+\)|\.*……+\.*)/g).map((part, index) => {
                                        // Check if this is a number in parentheses like (1)
                                        const numberMatch = part.match(/\((\d+)\)/);
                                        // Check if this is dots/blanks
                                        const blankMatch = part.match(/\.*……+\.*/) || part.match(/…+/);

                                        if (numberMatch || blankMatch) {
                                            return (
                                                <span
                                                    key={index}
                                                    style={{
                                                        border: '1px solid #ced4da',
                                                        borderRadius: '4px',
                                                        padding: '6px 12px',
                                                        backgroundColor: '#f8f9fa',
                                                        minWidth: '100px',
                                                        textAlign: 'center',
                                                        fontFamily: 'monospace',
                                                        fontWeight: 'bold',
                                                        color: getStatusColor(question)
                                                    }}
                                                >
                                                    {question.responseText || '(no answer)'}
                                                </span>
                                            );
                                        }

                                        return <span key={index}>{part}</span>;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Summary completion format with long text
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '20px',
                        lineHeight: '1.8',
                        fontSize: '14px'
                    }}>
                        {renderCompletionTextWithBlanks(parsedContext.completionText)}
                    </div>
                )}
            </div>
        );
    };

    // ✅ Render completion text with highlighted blanks
    const renderCompletionTextWithBlanks = (text) => {
        if (!text) return null;

        // Split text and find blanks with numbers
        const parts = text.split(/(\s*___\d+___\s*)/);

        return (
            <div>
                {parts.map((part, index) => {
                    const blankMatch = part.match(/___(\d+)___/);

                    if (blankMatch) {
                        const questionNum = blankMatch[1];
                        const isCurrentQuestion = questionNum == (question.displayNumber || question.orderInTest || question.questionId);
                        const remainingText = part.replace(/___\d+___/, '').trim(); // ← FIX

                        return (
                            <span
                                key={index}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    backgroundColor: isCurrentQuestion ? '#fff3cd' : '#e9ecef',
                                    border: isCurrentQuestion ? '2px solid #ffc107' : '1px solid #ced4da',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    margin: '0 4px',
                                    minWidth: '80px',
                                    justifyContent: 'center',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    position: 'relative'
                                }}
                            >
                            {isCurrentQuestion && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '-8px',
                                    backgroundColor: getStatusColor(question),
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    {questionNum}
                                </span>
                            )}

                                {isCurrentQuestion ? (
                                    <span style={{
                                        color: getStatusColor(question),
                                        fontWeight: 'bold'
                                    }}>
                                    {question.responseText || '(no answer)'}
                                </span>
                                ) : (
                                    <span style={{ color: '#6c757d' }}>
                                    ____{questionNum}____
                                </span>
                                )}
                        </span>
                        );
                    }

                    return <span key={index}>{part}</span>;
                })}
            </div>
        );
    };

    // ✅ Enhanced render content for listening vs reading
    const renderContent = () => {
        if (passage?.contentType === 'audio') {
            // ✅ LISTENING: Audio player + transcript + question content
            return (
                <div style={{ marginBottom: '30px' }}>
                    {/* Audio Section */}
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '15px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #bbdefb'
                    }}>
                        <h4 style={{
                            margin: '0 0 10px 0',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1976d2'
                        }}>
                            🎧 {passage.title || 'Audio Content'}
                        </h4>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto auto',
                            gap: '10px',
                            marginBottom: '15px',
                            fontSize: '14px'
                        }}>
                            <div><strong>Section:</strong> {passage.section || 'Unknown Section'}</div>
                            {passage.durationSeconds && (
                                <div><strong>Duration:</strong> {Math.floor(passage.durationSeconds / 60)}:{(passage.durationSeconds % 60).toString().padStart(2, '0')}</div>
                            )}
                        </div>

                        {/* Audio Player */}
                        {passage?.fileUrl || passage?.audioUrl || passage?.audioBase64 ? (
                            <audio
                                controls
                                src={passage.audioBase64 || passage.fileUrl || passage.audioUrl}
                                style={{ width: '100%', marginBottom: '10px' }}
                                preload="metadata"
                            >
                                Trình duyệt không hỗ trợ audio.
                            </audio>
                        ) : (
                            <div style={{
                                backgroundColor: '#fff3cd',
                                border: '1px solid #ffeaa7',
                                borderRadius: '4px',
                                padding: '12px',
                                textAlign: 'center'
                            }}>
                                <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
                                    🎧 Audio không có sẵn cho câu hỏi này
                                </p>
                            </div>
                        )}

                        {/* Transcript Toggle */}
                        <button
                            onClick={() => setShowTranscript(!showTranscript)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#1976d2',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textDecoration: 'underline',
                                padding: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            📝 {showTranscript ? 'Ẩn Transcript ▲' : 'Hiển thị Transcript ▼'}
                        </button>
                    </div>

                    {/* Transcript (collapsible) */}
                    {showTranscript && passage.transcript && (
                        <div style={{
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '20px',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}>
                            <h5 style={{
                                margin: '0 0 10px 0',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#495057'
                            }}>
                                Transcript:
                            </h5>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                margin: 0,
                                fontFamily: 'inherit',
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: '#495057'
                            }}>
                                {passage.transcript}
                            </pre>
                        </div>
                    )}

                    {/* Question Content */}
                    {renderListeningQuestionContent()}
                </div>
            );
        } else {
            // ✅ READING: Passage content (existing)
            return (
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{
                        margin: '0 0 15px 0',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#495057'
                    }}>
                        📖 {passage?.title || 'Passage Content'}
                    </h4>
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        padding: '20px',
                        borderRadius: '8px',
                        lineHeight: '1.6',
                        fontSize: '14px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #e9ecef'
                    }}>
                        {passage?.content ? (
                            passage.content.split('\n\n').map((paragraph, index) => {
                                const match = paragraph.match(/^([A-Z])\s(.*)$/);
                                if (match) {
                                    return (
                                        <p key={index} style={{ marginBottom: '15px' }}>
                                            <strong style={{
                                                color: '#007bff',
                                                marginRight: '8px'
                                            }}>
                                                {match[1]}
                                            </strong>
                                            {match[2]}
                                        </p>
                                    );
                                }
                                return (
                                    <p key={index} style={{ marginBottom: '15px' }}>
                                        {paragraph}
                                    </p>
                                );
                            })
                        ) : (
                            <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                Nội dung đoạn văn không có sẵn
                            </p>
                        )}
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="popup-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="popup-content" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>
                        Đáp án chi tiết #{question.displayNumber || question.orderInTest || question.questionId}
                        {question.isSkipped && (
                            <span style={{
                                marginLeft: '10px',
                                padding: '2px 8px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                BỎ QUA
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#6c757d'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Test Info */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #e9ecef',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h3 style={{
                        margin: '0 0 5px 0',
                        fontSize: '16px',
                        color: '#495057'
                    }}>
                        {testName || 'IELTS Test'}
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#6c757d'
                    }}>
                        {formatQuestionTypeSafe(question.questionType)}
                    </p>
                </div>

                {/* Content */}
                <div style={{ padding: '20px' }}>
                    {/* Content (Audio or Passage) */}
                    {renderContent()}

                    {/* Answer Analysis Section */}
                    <div style={{
                        borderTop: '1px solid #e9ecef',
                        paddingTop: '20px',
                        marginTop: '20px'
                    }}>
                        <h4 style={{
                            margin: '0 0 15px 0',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}>
                            Phân tích đáp án
                        </h4>

                        {/* Question Number Display */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            marginBottom: '15px',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                        }}>
                            <span style={{
                                backgroundColor: getStatusColor(question),
                                color: 'white',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                {question.displayNumber || question.orderInTest || question.questionId}
                            </span>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    Question {question.displayNumber || question.orderInTest || question.questionId}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                    Status: {question.isSkipped ? 'Skipped' : (question.isCorrect ? 'Correct' : 'Incorrect')}
                                </div>
                            </div>
                        </div>

                        {/* User's Answer (if any) */}
                        {question.responseText && !question.isSkipped && (
                            <div style={{
                                backgroundColor: question.isCorrect ? '#d4edda' : '#f8d7da',
                                border: `1px solid ${question.isCorrect ? '#c3e6cb' : '#f5c6cb'}`,
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '10px'
                            }}>
                                <strong style={{ fontSize: '14px' }}>Câu trả lời của bạn: </strong>
                                <span style={{
                                    fontSize: '14px',
                                    color: question.isCorrect ? '#155724' : '#721c24'
                                }}>
                                    {question.responseText}
                                </span>
                                <span style={{
                                    fontSize: '14px',
                                    color: question.isCorrect ? '#155724' : '#721c24',
                                    marginLeft: '8px'
                                }}>
                                    ({question.isCorrect ? 'ĐÚNG' : 'SAI'})
                                </span>
                            </div>
                        )}

                        {/* Skipped Notice */}
                        {question.isSkipped && (
                            <div style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '10px'
                            }}>
                                <strong style={{
                                    fontSize: '14px',
                                    color: '#6c757d'
                                }}>
                                    Câu hỏi này đã bị bỏ qua (không trả lời)
                                </strong>
                            </div>
                        )}

                        {/* Correct Answer */}
                        <div style={{
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            padding: '12px'
                        }}>
                            <strong style={{
                                fontSize: '14px',
                                color: '#155724'
                            }}>
                                Đáp án đúng:
                            </strong>
                            <span style={{
                                fontSize: '14px',
                                color: '#155724',
                                marginLeft: '8px',
                                fontWeight: 'bold'
                            }}>
                                {question.correctAnswer || 'Chưa có đáp án'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionDetailPopup;