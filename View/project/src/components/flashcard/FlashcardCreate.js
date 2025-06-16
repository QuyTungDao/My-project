import React, { useState, useEffect } from 'react';
import { Save, Play, Plus } from 'lucide-react';

const FlashcardCreate = () => {
    const [formData, setFormData] = useState({
        word: '',
        meaning: '',
        exampleSentence: '',
        context: '',
        category: 'IELTS',
        pronunciation: '',
        wordType: 'NOUN',
        synonyms: '',
        setName: '',
        isPublic: false,
        difficultyLevel: 'MEDIUM'
    });

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/flashcards/sets');
            const data = await response.json();
            setSets(data);
        } catch (error) {
            console.error('Error fetching sets:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const fetchPronunciation = async () => {
        if (!formData.word) return;

        setLoading(true);
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${formData.word}`);
            const data = await response.json();

            if (data[0]?.phonetics) {
                const pronunciation = data[0].phonetics.find(p => p.text)?.text || '';
                setFormData(prev => ({ ...prev, pronunciation }));
            }
        } catch (error) {
            console.error('Error fetching pronunciation:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/flashcards/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSuccess(true);
                setFormData({
                    word: '',
                    meaning: '',
                    exampleSentence: '',
                    context: '',
                    category: 'IELTS',
                    pronunciation: '',
                    wordType: 'NOUN',
                    synonyms: '',
                    setName: '',
                    isPublic: false,
                    difficultyLevel: 'MEDIUM'
                });
                setTimeout(() => setSuccess(false), 3000);
            } else {
                alert('Có lỗi xảy ra khi tạo flashcard');
            }
        } catch (error) {
            console.error('Error creating flashcard:', error);
            alert('Có lỗi xảy ra khi tạo flashcard');
        }
        setLoading(false);
    };

    return (
        <div className="create-container">
            <div className="create-form-container">
                <h1 className="create-title">
                    ✏️ Tạo Flashcard Mới
                </h1>

                {success && (
                    <div className="success-message">
                        <p className="success-text">✅ Flashcard đã được tạo thành công!</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Word */}
                        <div className="form-field">
                            <label className="form-label">
                                Từ vựng *
                            </label>
                            <div className="form-input-group">
                                <input
                                    type="text"
                                    name="word"
                                    value={formData.word}
                                    onChange={handleChange}
                                    required
                                    className="form-input flex-1"
                                    placeholder="estimate"
                                />
                                <button
                                    type="button"
                                    onClick={fetchPronunciation}
                                    disabled={loading || !formData.word}
                                    className="pronunciation-fetch-btn"
                                >
                                    {loading ? '...' : '🔊'}
                                </button>
                            </div>
                        </div>

                        {/* Pronunciation */}
                        <div className="form-field">
                            <label className="form-label">
                                Phiên âm (IPA)
                            </label>
                            <input
                                type="text"
                                name="pronunciation"
                                value={formData.pronunciation}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="/ˈestɪmət/"
                            />
                        </div>
                    </div>

                    {/* Meaning */}
                    <div className="form-field">
                        <label className="form-label">
                            Nghĩa tiếng Việt *
                        </label>
                        <input
                            type="text"
                            name="meaning"
                            value={formData.meaning}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="sự đánh giá, sự ước lượng"
                        />
                    </div>

                    {/* Example Sentence */}
                    <div className="form-field">
                        <label className="form-label">
                            Câu ví dụ
                        </label>
                        <textarea
                            name="exampleSentence"
                            value={formData.exampleSentence}
                            onChange={handleChange}
                            rows={3}
                            className="form-textarea"
                            placeholder="I can give you a rough estimate of the amount of wood you will need."
                        />
                    </div>

                    <div className="form-grid">
                        {/* Word Type */}
                        <div className="form-field">
                            <label className="form-label">
                                Loại từ
                            </label>
                            <select
                                name="wordType"
                                value={formData.wordType}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="NOUN">Noun (Danh từ)</option>
                                <option value="VERB">Verb (Động từ)</option>
                                <option value="ADJECTIVE">Adjective (Tính từ)</option>
                                <option value="ADVERB">Adverb (Trạng từ)</option>
                                <option value="PREPOSITION">Preposition (Giới từ)</option>
                                <option value="CONJUNCTION">Conjunction (Liên từ)</option>
                                <option value="PRONOUN">Pronoun (Đại từ)</option>
                                <option value="PHRASE">Phrase (Cụm từ)</option>
                                <option value="IDIOM">Idiom (Thành ngữ)</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="form-field">
                            <label className="form-label">
                                Danh mục
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="IELTS">IELTS</option>
                                <option value="TOEIC">TOEIC</option>
                                <option value="Basic English">Basic English</option>
                                <option value="Business English">Business English</option>
                                <option value="Academic English">Academic English</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-grid">
                        {/* Set Name */}
                        <div className="form-field">
                            <label className="form-label">
                                Tên bộ thẻ
                            </label>
                            <input
                                type="text"
                                name="setName"
                                value={formData.setName}
                                onChange={handleChange}
                                list="existing-sets"
                                className="form-input"
                                placeholder="IELTS Essential Vocabulary"
                            />
                            <datalist id="existing-sets">
                                {sets.map((set, index) => (
                                    <option key={index} value={set} />
                                ))}
                            </datalist>
                        </div>

                        {/* Difficulty */}
                        <div className="form-field">
                            <label className="form-label">
                                Độ khó
                            </label>
                            <select
                                name="difficultyLevel"
                                value={formData.difficultyLevel}
                                onChange={handleChange}
                                className="form-select"
                            >
                                <option value="EASY">Dễ</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HARD">Khó</option>
                            </select>
                        </div>
                    </div>

                    {/* Synonyms */}
                    <div className="form-field">
                        <label className="form-label">
                            Từ đồng nghĩa (phân cách bằng dấu phẩy)
                        </label>
                        <input
                            type="text"
                            name="synonyms"
                            value={formData.synonyms}
                            onChange={handleChange}
                            className="form-input"
                            placeholder="assessment, evaluation, approximation"
                        />
                    </div>

                    {/* Context */}
                    <div className="form-field">
                        <label className="form-label">
                            Ngữ cảnh sử dụng
                        </label>
                        <textarea
                            name="context"
                            value={formData.context}
                            onChange={handleChange}
                            rows={2}
                            className="form-textarea"
                            placeholder="Business, academic contexts"
                        />
                    </div>

                    {/* Public Checkbox */}
                    <div className="form-checkbox-group">
                        <input
                            type="checkbox"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleChange}
                            className="form-checkbox"
                        />
                        <label className="form-checkbox-label">
                            Cho phép người khác sử dụng thẻ này
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            disabled={loading}
                            className="form-submit-btn"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Đang tạo...' : 'Tạo Flashcard'}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.location.href = '/flashcards'}
                            className="form-cancel-btn"
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FlashcardCreate;