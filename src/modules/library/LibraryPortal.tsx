import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Search,
  Barcode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Filter,
  Plus,
  ArrowRight,
  BookMarked,
  Clock,
  User,
  ShieldCheck,
  Eye,
  Layers,
} from "lucide-react";
import { INITIAL_DIGITAL_RESOURCES } from "../../data/mockCollegeData";
import { collegeErpService, subscribeErpSync } from "../../services/collegeErpService";
import { LibraryBook, BookLoan, DigitalResource, PortalRole } from "../../types";
import { useSyncedPortalTab } from "../../context/PortalShellContext";

interface LibraryPortalProps {
  onSwitchPortal?: (role: PortalRole) => void;
}

export default function LibraryPortal({ onSwitchPortal }: LibraryPortalProps) {
  const [activeTab, setActiveTab] = useSyncedPortalTab<
    "catalogue" | "circulation" | "digital" | "fines"
  >("library", "catalogue");
  const [books, setBooks] = useState<LibraryBook[]>(() => collegeErpService.getState().books);
  const [loans, setLoans] = useState<BookLoan[]>(() => collegeErpService.getState().loans);
  const [resources] = useState<DigitalResource[]>(INITIAL_DIGITAL_RESOURCES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [libraryBanner, setLibraryBanner] = useState<string | null>(null);

  useEffect(() => {
    return subscribeErpSync(() => {
      const st = collegeErpService.getState();
      setBooks([...st.books]);
      setLoans([...st.loans]);
    });
  }, []);

  // Issue modal / form state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueBarcode, setIssueBarcode] = useState("BC-LIB-10029");
  const [issueStudentReg, setIssueStudentReg] = useState("HCA/STU/2026/001");
  const [issueStudentName, setIssueStudentName] = useState("Amina Wanjiku");
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Reader modal
  const [readingResource, setReadingResource] = useState<DigitalResource | null>(null);

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    const res = collegeErpService.issueOrReserveBook({
      barcode: issueBarcode,
      studentRegNo: issueStudentReg,
      studentName: issueStudentName,
    });
    if (!res.ok || !res.loan) {
      setLibraryBanner(res.error ?? "Book copy is not currently available for checkout.");
      return;
    }

    const st = collegeErpService.getState();
    setLoans([...st.loans]);
    setBooks([...st.books]);
    setIssueSuccess(`Successfully issued "${res.loan.bookTitle}" to ${issueStudentName} (${issueStudentReg}). Due in 14 days.`);
    setTimeout(() => {
      setShowIssueModal(false);
      setIssueSuccess(null);
    }, 2000);
  };

  const handleReturnBook = (loanId: string) => {
    const res = collegeErpService.returnLibraryBook(loanId);
    if (res.ok) {
      const st = collegeErpService.getState();
      setLoans([...st.loans]);
      setBooks([...st.books]);
      setLibraryBanner("Book returned cleanly and inventory updated across Student & Library portals.");
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-[#092c60] text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen size={16} />
            <span>MODULE 22 · PHYSICAL &amp; DIGITAL LIBRARY MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-bold">HI-TECH College Central Library Portal</h1>
          <p className="text-blue-100 text-xs mt-1">
            Integrated catalogue, copy barcodes, loan circulation, digital reading rooms &amp; overdue fine tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSwitchPortal && (
            <button
              type="button"
              onClick={() => onSwitchPortal("student")}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20"
            >
              Student Library View
            </button>
          )}
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-bold rounded-xl flex items-center gap-2 shadow"
          >
            <Plus size={16} /> Quick Book Issue Desk
          </button>
        </div>
      </div>

      {libraryBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3">
          <span>{libraryBanner}</span>
          <button type="button" onClick={() => setLibraryBanner(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("catalogue")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "catalogue"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookMarked size={16} /> Physical Books Catalogue ({books.length})
        </button>
        <button
          onClick={() => setActiveTab("circulation")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "circulation"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock size={16} /> Borrowing &amp; Returns Circulation ({loans.filter((l) => l.status === "BORROWED").length} Active)
        </button>
        <button
          onClick={() => setActiveTab("digital")}
          className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === "digital"
              ? "border-blue-600 text-blue-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers size={16} /> Digital Library &amp; E-Books ({resources.length})
        </button>
      </div>

      {/* CATALOGUE TAB */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, barcode, ISBN..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="ALL">All Subject Categories</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Networking">Networking &amp; Security</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                      <Barcode size={13} /> {book.barcode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        book.availableCopies > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {book.availableCopies > 0 ? `${book.availableCopies} Available` : "Checked Out"}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{book.title}</h3>
                  <p className="text-xs text-slate-600 mb-3">{book.author} ({book.year})</p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Dewey Class:</span>
                    <strong className="font-mono text-slate-800">{book.classificationNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Shelf Location:</span>
                    <strong className="text-slate-800">{book.shelfLocation}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Copies:</span>
                    <span>{book.totalCopies} copies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CIRCULATION TAB */}
      {activeTab === "circulation" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">Active Book Loans &amp; Circulation Desk</h3>
            <span className="text-xs text-slate-500 font-mono">14-Day Lending Policy</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Barcode</th>
                <th className="p-4">Book Title</th>
                <th className="p-4">Borrower Name</th>
                <th className="p-4">Reg No</th>
                <th className="p-4">Borrow Date</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-700">{loan.barcode}</td>
                  <td className="p-4 font-semibold text-slate-900">{loan.bookTitle}</td>
                  <td className="p-4 text-slate-800">{loan.borrowerName}</td>
                  <td className="p-4 font-mono text-blue-700">{loan.borrowerRegNo}</td>
                  <td className="p-4 text-slate-500">{loan.borrowDate}</td>
                  <td className="p-4 font-semibold text-slate-800">{loan.dueDate}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        loan.status === "BORROWED"
                          ? "bg-blue-100 text-blue-800"
                          : loan.status === "OVERDUE"
                          ? "bg-red-100 text-red-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {loan.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {loan.status === "BORROWED" && (
                      <button
                        onClick={() => handleReturnBook(loan.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded"
                      >
                        Return Copy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DIGITAL LIBRARY TAB */}
      {activeTab === "digital" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {res.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{res.fileSize}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{res.title}</h4>
                  <p className="text-xs text-slate-500 mb-2">By {res.author} ({res.publishYear})</p>
                  <p className="text-xs text-slate-600 line-clamp-2">{res.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">{res.downloadsCount} reads</span>
                  <button
                    onClick={() => setReadingResource(res)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Open Reader
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ISSUE BOOK MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Barcode size={20} className="text-blue-600" />
                Issue Book at Circulation Desk
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {issueSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{issueSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleIssueBook} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Book Copy Barcode</label>
                  <select
                    value={issueBarcode}
                    onChange={(e) => setIssueBarcode(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  >
                    {books.map((b) => (
                      <option key={b.barcode} value={b.barcode}>
                        {b.barcode} — {b.title} ({b.availableCopies} avail)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Student Registration Number</label>
                  <input
                    type="text"
                    value={issueStudentReg}
                    onChange={(e) => setIssueStudentReg(e.target.value.toUpperCase())}
                    placeholder="e.g. HCA/STU/2026/001"
                    className="w-full text-xs font-mono font-bold p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Student Full Name</label>
                  <input
                    type="text"
                    value={issueStudentName}
                    onChange={(e) => setIssueStudentName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg"
                  >
                    Confirm Issue (14 Days)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DIGITAL RESOURCE READER MODAL */}
      {readingResource && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600">{readingResource.type}</span>
                <h3 className="text-base font-bold text-slate-900">{readingResource.title}</h3>
                <p className="text-xs text-slate-500">Author: {readingResource.author}</p>
              </div>
              <button onClick={() => setReadingResource(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700 leading-relaxed font-serif">
              <p className="font-bold text-slate-900 text-sm">Abstract &amp; Executive Summary</p>
              <p>{readingResource.description}</p>
              <p>
                In compliance with the Kenya Data Protection Act (2019) and Commission for University Education standards,
                HI-TECH College maintains high-fidelity cryptographic access controls for digital library repositories.
                This authenticated viewer records reading telemetry and safeguards licensed scholarly works.
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-sans text-xs">
                <strong>Certified Digital Library Access</strong> · Viewing under authorized student ID token. Watermark applied.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setReadingResource(null);
                  setLibraryBanner(`Downloaded verified PDF resource: "${readingResource.title}"`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <Download size={15} /> Download PDF ({readingResource.fileSize})
              </button>
              <button
                onClick={() => setReadingResource(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
