import { useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Login from './pages/Login';
import Donation from './pages/Donation';
import About from './pages/About';
import Contact from './pages/Contact';
import DoctorsList from './pages/DoctorsList';
import SurgeryPlanning from './pages/SurgeryPlanning';
import Pharmacy from './pages/Pharmacy';
import LabTests from './pages/LabTests';
import ConsultOnline from './pages/ConsultOnline';
import InClinic from './pages/InClinic';
import Courses from './pages/Courses';
import DashboardPatient from './pages/DashboardPatient';
import DashboardDonor from './pages/DashboardDonor';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardStudent from './pages/DashboardStudent';
import DashboardTeacher from './pages/DashboardTeacher';
import DashboardPharmacy from './pages/DashboardPharmacy';
import DashboardDoctor from './pages/DashboardDoctor';
import DashboardBloodBank from './pages/DashboardBloodBank';
import DashboardLab from './pages/DashboardLab';
import BloodRequest from './pages/BloodRequest';
import PendingApproval from './components/PendingApproval';
import VideoCall from './pages/VideoCall';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import HomeServices from './pages/HomeServices';

export default function App() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<div className="min-h-screen flex flex-col">
			<header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 md:h-20">
						<Link to="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
							<div className="relative">
								<div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
								<img 
									src="/last-logo.png" 
									alt="Dr. Sanaullah Welfare Foundation Logo" 
									className="relative h-12 md:h-16 lg:h-20 w-auto object-contain transition-transform group-hover:scale-105 duration-300 filter drop-shadow-sm"
								/>
							</div>
							<div className="hidden sm:block">
								<span className="text-sm md:text-lg lg:text-xl font-bold text-gray-900 group-hover:text-brand transition-colors duration-300 block leading-tight">
									Dr. Sanaullah Welfare Foundation
								</span>
								<span className="text-xs text-gray-500 font-medium hidden md:block">Trusted Healthcare for All</span>
							</div>
						</Link>
						<nav className="hidden md:flex items-center gap-1">
							<NavLink 
								to="/about" 
								className={({isActive}) => 
									`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
										isActive 
											? 'text-brand bg-brand/10' 
											: 'text-gray-700 hover:text-brand hover:bg-gray-50'
									}`
								}
							>
								About
							</NavLink>
							<NavLink 
								to="/contact" 
								className={({isActive}) => 
									`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
										isActive 
											? 'text-brand bg-brand/10' 
											: 'text-gray-700 hover:text-brand hover:bg-gray-50'
									}`
								}
							>
								Contact
							</NavLink>
							<NavLink 
								to="/donation" 
								className={({isActive}) => 
									`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
										isActive 
											? 'text-brand bg-brand/10' 
											: 'text-gray-700 hover:text-brand hover:bg-gray-50'
									}`
								}
							>
								Donate
							</NavLink>
							<NavLink 
								to="/jobs" 
								className={({isActive}) => 
									`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
										isActive 
											? 'text-brand bg-brand/10' 
											: 'text-gray-700 hover:text-brand hover:bg-gray-50'
									}`
								}
							>
								Jobs
							</NavLink>
							<NavLink 
								to="/home-services" 
								className={({isActive}) => 
									`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
										isActive 
											? 'text-brand bg-brand/10' 
											: 'text-gray-700 hover:text-brand hover:bg-gray-50'
									}`
								}
							>
								Home Services
							</NavLink>
							<NavLink 
								to="/login" 
								className={({isActive}) => 
									`ml-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 relative ${
										isActive 
											? 'text-white bg-brand shadow-lg shadow-brand/30' 
											: 'text-white bg-gradient-to-r from-brand to-brand-dark shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/30 hover:scale-105'
									}`
								}
							>
								Login
							</NavLink>
						</nav>
						<div className="md:hidden flex items-center gap-2">
							<NavLink 
								to="/login" 
								className={({isActive}) => 
									`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
										isActive 
											? 'text-white bg-brand shadow-lg' 
											: 'text-white bg-gradient-to-r from-brand to-brand-dark shadow-md'
									}`
								}
							>
								Login
							</NavLink>
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
								aria-label="Toggle menu"
							>
								{mobileMenuOpen ? (
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								) : (
									<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
									</svg>
								)}
							</button>
						</div>
					</div>
					{/* Mobile Menu */}
					{mobileMenuOpen && (
						<div className="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top">
							<nav className="flex flex-col space-y-2">
								<NavLink 
									to="/about" 
									onClick={() => setMobileMenuOpen(false)}
									className={({isActive}) => 
										`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
											isActive 
												? 'text-brand bg-brand/10' 
												: 'text-gray-700 hover:text-brand hover:bg-gray-50'
										}`
									}
								>
									About
								</NavLink>
								<NavLink 
									to="/contact" 
									onClick={() => setMobileMenuOpen(false)}
									className={({isActive}) => 
										`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
											isActive 
												? 'text-brand bg-brand/10' 
												: 'text-gray-700 hover:text-brand hover:bg-gray-50'
										}`
									}
								>
									Contact
								</NavLink>
								<NavLink 
									to="/donation" 
									onClick={() => setMobileMenuOpen(false)}
									className={({isActive}) => 
										`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
											isActive 
												? 'text-brand bg-brand/10' 
												: 'text-gray-700 hover:text-brand hover:bg-gray-50'
										}`
									}
								>
									Donate
								</NavLink>
								<NavLink 
									to="/jobs" 
									onClick={() => setMobileMenuOpen(false)}
									className={({isActive}) => 
										`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
											isActive 
												? 'text-brand bg-brand/10' 
												: 'text-gray-700 hover:text-brand hover:bg-gray-50'
										}`
									}
								>
									Jobs
								</NavLink>
								<NavLink 
									to="/home-services" 
									onClick={() => setMobileMenuOpen(false)}
									className={({isActive}) => 
										`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
											isActive 
												? 'text-brand bg-brand/10' 
												: 'text-gray-700 hover:text-brand hover:bg-gray-50'
										}`
									}
								>
									Home Services
								</NavLink>
							</nav>
						</div>
					)}
				</div>
			</header>
			<main className="flex-1">
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/about" element={<About />} />
				<Route path="/contact" element={<Contact />} />
				<Route path="/donation" element={<Donation />} />
				<Route path="/login" element={<Login />} />
				<Route path="/doctors" element={<DoctorsList />} />
				<Route path="/surgery" element={<SurgeryPlanning />} />
				<Route path="/pharmacy" element={<Pharmacy />} />
				<Route path="/lab-tests" element={<LabTests />} />
				<Route path="/consult-online" element={<ConsultOnline />} />
				<Route path="/in-clinic" element={<InClinic />} />
				<Route path="/courses" element={<Courses />} />
				<Route path="/blood-request" element={<BloodRequest />} />
				<Route path="/jobs" element={<Jobs />} />
				<Route path="/jobs/:id" element={<JobDetails />} />
				<Route path="/home-services" element={<HomeServices />} />
				<Route path="/dashboard/patient" element={<DashboardPatient />} />
				<Route path="/dashboard/donor" element={<DashboardDonor />} />
				<Route path="/dashboard/admin" element={<DashboardAdmin />} />
				<Route path="/dashboard/student" element={<DashboardStudent />} />
				<Route path="/dashboard/teacher" element={<DashboardTeacher />} />
				<Route path="/dashboard/pharmacy" element={<DashboardPharmacy />} />
				<Route path="/dashboard/doctor" element={<DashboardDoctor />} />
				<Route path="/dashboard/blood-bank" element={<DashboardBloodBank />} />
				<Route path="/dashboard/lab" element={<DashboardLab />} />
				<Route path="/pending-approval" element={<PendingApproval />} />
				<Route path="/video-call/:appointmentId" element={<VideoCall />} />
			</Routes>
			</main>
			<footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
				<div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6">
						<div>
							<div className="flex items-center gap-2 mb-3">
								<img 
									src="/last-logo.png" 
									alt="Logo" 
									className="h-12 md:h-16 lg:h-20 w-auto object-contain"
								/>
								<span className="text-xs md:text-sm font-bold text-brand">DSWF</span>
							</div>
							<p className="text-xs text-gray-600 leading-relaxed">
								Dedicated to providing quality healthcare and education services to underserved communities.
							</p>
						</div>
						<div>
							<h4 className="text-xs md:text-sm font-semibold text-gray-800 mb-2 md:mb-3">Quick Links</h4>
							<ul className="space-y-1 md:space-y-2">
								<li><Link to="/about" className="text-xs text-gray-600 hover:text-brand transition-colors">About Us</Link></li>
								<li><Link to="/contact" className="text-xs text-gray-600 hover:text-brand transition-colors">Contact</Link></li>
								<li><Link to="/donation" className="text-xs text-gray-600 hover:text-brand transition-colors">Donate</Link></li>
								<li><Link to="/jobs" className="text-xs text-gray-600 hover:text-brand transition-colors">Jobs</Link></li>
								<li><Link to="/home-services" className="text-xs text-gray-600 hover:text-brand transition-colors">Home Services</Link></li>
							</ul>
						</div>
						<div>
							<h4 className="text-xs md:text-sm font-semibold text-gray-800 mb-2 md:mb-3">Services</h4>
							<ul className="space-y-1 md:space-y-2">
								<li className="text-xs text-gray-600">🏥 Medical Services</li>
								<li className="text-xs text-gray-600">🧪 Laboratory Tests</li>
								<li className="text-xs text-gray-600">🎓 Education Programs</li>
								<li className="text-xs text-gray-600">💊 Pharmacy</li>
							</ul>
						</div>
						<div>
							<h4 className="text-xs md:text-sm font-semibold text-gray-800 mb-2 md:mb-3">Connect</h4>
							<div className="flex gap-2 md:gap-3">
								<div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer">
									<span className="text-xs">f</span>
								</div>
								<div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer">
									<span className="text-xs">in</span>
								</div>
								<div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer">
									<span className="text-xs">@</span>
								</div>
							</div>
						</div>
					</div>
					<div className="border-t border-gray-200 pt-4 md:pt-6 text-center">
						<p className="text-xs text-gray-500">© {new Date().getFullYear()} Dr. Sanaullah Welfare Foundation. All rights reserved.</p>
						<p className="text-xs text-gray-400 mt-1">Developed by Salman Khan</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
